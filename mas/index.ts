import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Codex, type SandboxMode } from "@openai/codex-sdk";
import { config as loadEnvFile } from "dotenv";

type Worker = "researcher" | "programmer" | "tester";
type Route = Worker | typeof END;
type Stage = "new" | "researched" | "implemented" | "tests_failed" | "tests_passed";

const MAX_REVISIONS = 2;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Load local configuration without replacing variables already set in the shell.
loadEnvFile({ path: resolve(root, ".env.local"), quiet: true });
const apiKey = process.env.OPENAI_API_KEY?.trim();
const codex = new Codex(apiKey ? { apiKey } : {});

// Each node updates only its part of this shared workflow state.
const State = Annotation.Root({
  task: Annotation<string>(),
  stage: Annotation<Stage>(),
  next: Annotation<Route>(),
  revision: Annotation<number>(),
  handoff: Annotation<string>(),
  research: Annotation<string>(),
  implementation: Annotation<string>(),
  testReport: Annotation<string>(),
  finalReport: Annotation<string>(),
});

type WorkflowState = typeof State.State;
type Agent = "coordinator" | Worker;

// Run one role in a fresh Codex thread. Without an API key, Codex reuses the
// local ChatGPT login shared by the CLI and VS Code extension.
async function runAgent(
  agent: Agent,
  assignment: string,
  sandboxMode: SandboxMode,
  liveWeb = false,
): Promise<string> {
  const rolePrompt = await readFile(resolve(root, "agents", `${agent}.md`), "utf8");
  const thread = codex.startThread({
    approvalPolicy: "never",
    sandboxMode,
    workingDirectory: root,
    skipGitRepoCheck: true,
    networkAccessEnabled: liveWeb,
    webSearchMode: liveWeb ? "live" : "disabled",
  });
  const result = await thread.run(`${rolePrompt}\n\n## Current assignment\n\n${assignment}`);

  return result.finalResponse.trim();
}

// Coordinator is the only node that chooses the next destination. It prepares
// every handoff and sends failed verification through a bounded repair loop.
async function coordinator(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("\n[coordinator] starting");

  if (state.stage === "new") {
    const handoff = await runAgent(
      "coordinator",
      `Developer request: ${state.task}\n\nCreate a minimal plan and Researcher handoff.`,
      "read-only",
    );
    return { handoff, next: "researcher" };
  }

  if (state.stage === "researched") {
    const handoff = await runAgent(
      "coordinator",
      `Developer request: ${state.task}\n\nResearch report:\n${state.research}\n\nCreate the Programmer handoff.`,
      "read-only",
    );
    return { handoff, next: "programmer" };
  }

  if (state.stage === "implemented") {
    const handoff = await runAgent(
      "coordinator",
      `Developer request: ${state.task}\n\nProgrammer report:\n${state.implementation}\n\nCreate the Tester handoff.`,
      "read-only",
    );
    return { handoff, next: "tester" };
  }

  if (state.stage === "tests_failed" && state.revision < MAX_REVISIONS) {
    const handoff = await runAgent(
      "coordinator",
      `Developer request: ${state.task}\n\nFailed tests:\n${state.testReport}\n\nCreate a focused repair handoff.`,
      "read-only",
    );
    return { handoff, next: "programmer", revision: state.revision + 1 };
  }

  const finalReport = await runAgent(
    "coordinator",
    `Developer request: ${state.task}\n\nProgrammer report:\n${state.implementation}\n\nTester report:\n${state.testReport}\n\n${
      state.stage === "tests_passed"
        ? "Summarize the verified result."
        : "Summarize the remaining blockers; the repair limit was reached."
    }`,
    "read-only",
  );
  return { finalReport, next: END };
}

// Researcher can inspect the repository and current web sources, but cannot edit.
async function researcher(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("\n[researcher] starting");
  const research = await runAgent(
    "researcher",
    `Developer request: ${state.task}\n\nCoordinator handoff:\n${state.handoff}`,
    "read-only",
    true,
  );
  return { research, stage: "researched" };
}

// Programmer receives write access and all context needed to implement the handoff.
async function programmer(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("\n[programmer] starting");
  const implementation = await runAgent(
    "programmer",
    [
      `Developer request: ${state.task}`,
      `Coordinator handoff:\n${state.handoff}`,
      `Research report:\n${state.research}`,
      state.testReport ? `Previous test report:\n${state.testReport}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    "workspace-write",
  );
  return { implementation, stage: "implemented" };
}

// Tester needs write access because lint and build tools create artifacts. A
// missing PASS marker is treated as failure so the workflow fails closed.
async function tester(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("\n[tester] starting");
  const testReport = await runAgent(
    "tester",
    `Developer request: ${state.task}\n\nCoordinator handoff:\n${state.handoff}\n\nProgrammer report:\n${state.implementation}`,
    "workspace-write",
  );
  const stage: Stage = /VERDICT:\s*PASS\b/i.test(testReport)
    ? "tests_passed"
    : "tests_failed";

  return { testReport, stage };
}

// Workers always return to Coordinator; only Coordinator can route or finish.
export const maintenanceGraph = new StateGraph(State)
  .addNode("coordinator", coordinator)
  .addNode("researcher", researcher)
  .addNode("programmer", programmer)
  .addNode("tester", tester)
  .addEdge(START, "coordinator")
  .addConditionalEdges("coordinator", (state) => state.next, [
    "researcher",
    "programmer",
    "tester",
    END,
  ])
  .addEdge("researcher", "coordinator")
  .addEdge("programmer", "coordinator")
  .addEdge("tester", "coordinator")
  .compile();

// Read the maintenance request, seed the graph, and print Coordinator's report.
async function main(): Promise<void> {
  const task = process.argv.slice(2).join(" ").trim();
  if (!task) {
    throw new Error('Provide a task, for example: npm run mas -- "Fix the catalog filter"');
  }

  const result = await maintenanceGraph.invoke(
    {
      task,
      stage: "new",
      next: "researcher",
      revision: 0,
      handoff: "",
      research: "",
      implementation: "",
      testReport: "",
      finalReport: "",
    },
    { recursionLimit: 16 },
  );

  console.log("\n=== Maintenance workflow result ===\n");
  console.log(result.finalReport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nMaintenance workflow failed: ${message}`);
  process.exitCode = 1;
});
