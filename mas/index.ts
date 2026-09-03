// Node utilities load the Markdown prompts and resolve the repository root in a
// platform-independent way.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// LangGraph supplies the shared-state workflow. The Codex SDK executes each
// role, while dotenv loads the project's optional local API configuration.
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Codex, type SandboxMode, type WebSearchMode } from "@openai/codex-sdk";
import { config as loadEnvFile } from "dotenv";

// These unions keep every graph transition explicit. Only the Coordinator may
// choose a worker or end the workflow.
type WorkerName = "researcher" | "programmer" | "tester";
type RouteName = WorkerName | typeof END;
type Stage =
  | "new"
  | "researched"
  | "implemented"
  | "tests_failed"
  | "tests_passed";

// Two repair passes keep an unattended maintenance run useful without allowing an
// ambiguous request to loop forever.
const MAX_REVISIONS = 2;
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(moduleDirectory, "..");

// Match the app's existing local environment convention. dotenv preserves an
// OPENAI_API_KEY that the developer already exported in their shell.
loadEnvFile({ path: resolve(workspaceRoot, ".env.local"), quiet: true });

// All four nodes communicate through this shared LangGraph state. The request,
// current lifecycle stage, and routing decision control execution; the remaining
// fields carry each role's report to the next Coordinator visit.
const MaintenanceState = Annotation.Root({
  task: Annotation<string>(),
  dryRun: Annotation<boolean>(),
  stage: Annotation<Stage>(),
  next: Annotation<RouteName>(),
  revision: Annotation<number>(),
  plan: Annotation<string>(),
  handoff: Annotation<string>(),
  research: Annotation<string>(),
  implementation: Annotation<string>(),
  testReport: Annotation<string>(),
  finalReport: Annotation<string>(),
});

type MaintenanceStateValue = typeof MaintenanceState.State;
type RoleName = "coordinator" | WorkerName;

// A single role runner handles permissions consistently. Callers must choose a
// sandbox explicitly and may opt a role into Codex web search.
interface RoleRunOptions {
  role: RoleName;
  state: MaintenanceStateValue;
  prompt: string;
  sandboxMode: SandboxMode;
  webSearchMode?: WebSearchMode;
}

// Prompt files do not change during one process, so cache them after the first
// read instead of touching the filesystem every time a node is revisited.
const rolePrompts = new Map<RoleName, string>();

async function getRolePrompt(role: RoleName): Promise<string> {
  const cachedPrompt = rolePrompts.get(role);

  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = resolve(workspaceRoot, "agents", `${role}.md`);
  const prompt = await readFile(promptPath, "utf8");
  rolePrompts.set(role, prompt);
  return prompt;
}

function createCodexClient(): Codex {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // With no explicit key, the SDK reuses the local Codex login. This supports a
  // ChatGPT subscription session shared by Codex CLI and the VS Code extension.
  return new Codex(apiKey ? { apiKey } : {});
}

// Load the role definition, honor dry-run mode, then execute one isolated Codex
// thread with only the permissions that role needs. A fresh thread prevents one
// worker's conversational context from leaking into another worker.
async function runRole({
  role,
  state,
  prompt,
  sandboxMode,
  webSearchMode = "disabled",
}: RoleRunOptions): Promise<string> {
  const systemPrompt = await getRolePrompt(role);

  if (state.dryRun) {
    return `[dry run] ${role} prompt loaded (${systemPrompt.length} characters); assignment accepted.`;
  }

  // Non-interactive execution cannot answer approval prompts, so the sandbox is
  // the enforcement boundary and approvalPolicy remains "never".
  const thread = createCodexClient().startThread({
    approvalPolicy: "never",
    sandboxMode,
    workingDirectory: workspaceRoot,
    // A copied project can still use the workflow before its first Git commit.
    skipGitRepoCheck: true,
    networkAccessEnabled: webSearchMode === "live",
    webSearchMode,
  });
  const result = await thread.run(`${systemPrompt}\n\n## Current assignment\n\n${prompt}`);

  return result.finalResponse.trim();
}

// Keep terminal output small while still showing which graph node is active.
function printNodeStart(role: RoleName): void {
  console.log(`\n[${role}] starting`);
}

async function coordinatorNode(
  state: MaintenanceStateValue,
): Promise<Partial<MaintenanceStateValue>> {
  printNodeStart("coordinator");

  // First visit: translate the raw request into a plan and send Researcher a
  // focused evidence-gathering assignment.
  if (state.stage === "new") {
    const plan = await runRole({
      role: "coordinator",
      state,
      sandboxMode: "read-only",
      prompt: [
        `Developer request: ${state.task}`,
        "Create a minimal maintenance plan and a focused first handoff for Researcher.",
      ].join("\n\n"),
    });

    return { plan, handoff: plan, next: "researcher" };
  }

  // Research complete: combine the plan and findings into an implementation
  // handoff. Programmer does not need to infer scope from the original request.
  if (state.stage === "researched") {
    const handoff = await runRole({
      role: "coordinator",
      state,
      sandboxMode: "read-only",
      prompt: [
        `Developer request: ${state.task}`,
        `Current plan:\n${state.plan}`,
        `Research report:\n${state.research}`,
        "Reconcile the evidence and write the exact implementation handoff for Programmer.",
      ].join("\n\n"),
    });

    return { handoff, next: "programmer" };
  }

  // Implementation complete: tell Tester exactly what behavior and repository
  // checks must be verified.
  if (state.stage === "implemented") {
    const handoff = await runRole({
      role: "coordinator",
      state,
      sandboxMode: "read-only",
      prompt: [
        `Developer request: ${state.task}`,
        `Programmer report:\n${state.implementation}`,
        "Write a focused verification handoff for Tester. Include the required lint, typecheck, and build checks.",
      ].join("\n\n"),
    });

    return { handoff, next: "tester" };
  }

  // Failed verification returns to Programmer through Coordinator. Incrementing
  // the revision counter bounds this repair loop.
  if (state.stage === "tests_failed" && state.revision < MAX_REVISIONS) {
    const handoff = await runRole({
      role: "coordinator",
      state,
      sandboxMode: "read-only",
      prompt: [
        `Developer request: ${state.task}`,
        `Failed test report:\n${state.testReport}`,
        "Write a narrow repair handoff for Programmer. Preserve passing behavior and address only verified failures.",
      ].join("\n\n"),
    });

    return { handoff, next: "programmer", revision: state.revision + 1 };
  }

  // The only remaining states are success or an exhausted repair budget. In
  // either case, Coordinator produces the final developer-facing report.
  const passed = state.stage === "tests_passed";
  const finalReport = await runRole({
    role: "coordinator",
    state,
    sandboxMode: "read-only",
    prompt: [
      `Developer request: ${state.task}`,
      `Programmer report:\n${state.implementation}`,
      `Tester report:\n${state.testReport}`,
      passed
        ? "Summarize the completed and verified maintenance work for the developer."
        : `The ${MAX_REVISIONS} repair passes are exhausted. Summarize the remaining blockers without claiming success.`,
    ].join("\n\n"),
  });

  return { finalReport, next: END };
}

// Researcher is read-only but can use live search for current official guidance.
// Its report returns to Coordinator rather than routing directly to Programmer.
async function researcherNode(
  state: MaintenanceStateValue,
): Promise<Partial<MaintenanceStateValue>> {
  printNodeStart("researcher");
  const research = await runRole({
    role: "researcher",
    state,
    sandboxMode: "read-only",
    webSearchMode: "live",
    prompt: [
      `Developer request: ${state.task}`,
      `Coordinator handoff:\n${state.handoff}`,
      "Gather only the evidence needed for this handoff, then report to Coordinator.",
    ].join("\n\n"),
  });

  return { research, stage: "researched" };
}

// Programmer receives the latest handoff plus research and any prior failures.
// Workspace-write access lets Codex make the requested repository changes.
async function programmerNode(
  state: MaintenanceStateValue,
): Promise<Partial<MaintenanceStateValue>> {
  printNodeStart("programmer");
  const implementation = await runRole({
    role: "programmer",
    state,
    sandboxMode: "workspace-write",
    prompt: [
      `Developer request: ${state.task}`,
      `Coordinator handoff:\n${state.handoff}`,
      `Research context:\n${state.research}`,
      state.testReport ? `Previous test report:\n${state.testReport}` : "",
      "Implement the handoff, then report changed files and risks to Coordinator.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return { implementation, stage: "implemented" };
}

// Tester reviews the implementation and runs checks. It needs workspace-write
// because tools such as next build create generated artifacts such as `.next`.
async function testerNode(
  state: MaintenanceStateValue,
): Promise<Partial<MaintenanceStateValue>> {
  printNodeStart("tester");

  // A dry run validates graph routing without requiring authentication or
  // modifying build artifacts in the workspace.
  if (state.dryRun) {
    await getRolePrompt("tester");
    return {
      stage: "tests_passed",
      testReport: "Dry run reached Tester successfully.\nVERDICT: PASS",
    };
  }

  const testReport = await runRole({
    role: "tester",
    state,
    sandboxMode: "workspace-write",
    prompt: [
      `Developer request: ${state.task}`,
      `Coordinator handoff:\n${state.handoff}`,
      `Programmer report:\n${state.implementation}`,
      "Review the implementation and run the appropriate checks. End with the required VERDICT line.",
    ].join("\n\n"),
  });

  // Treat a missing PASS marker as failure. This fail-closed behavior prevents
  // an incomplete or malformed test response from ending the workflow as green.
  const stage: Stage = /VERDICT:\s*PASS\b/i.test(testReport)
    ? "tests_passed"
    : "tests_failed";

  return { testReport, stage };
}

// LangGraph calls this function after every Coordinator visit to select the next
// worker or the special END node from Coordinator's state update.
function routeFromCoordinator(state: MaintenanceStateValue): RouteName {
  return state.next;
}

// Workers can only return to the Coordinator. Conditional routing exists only
// on the Coordinator node, which keeps the hierarchy explicit and auditable.
export const maintenanceGraph = new StateGraph(MaintenanceState)
  .addNode("coordinator", coordinatorNode)
  .addNode("researcher", researcherNode)
  .addNode("programmer", programmerNode)
  .addNode("tester", testerNode)
  .addEdge(START, "coordinator")
  .addConditionalEdges("coordinator", routeFromCoordinator, [
    "researcher",
    "programmer",
    "tester",
    END,
  ])
  .addEdge("researcher", "coordinator")
  .addEdge("programmer", "coordinator")
  .addEdge("tester", "coordinator")
  .compile();

// Convert npm's remaining command-line arguments into one maintenance request.
// `--dry-run` may appear anywhere and is removed before the task is assembled.
function readTaskArgument(): { task: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const task = args.filter((arg) => arg !== "--dry-run").join(" ").trim();

  if (!task) {
    throw new Error(
      'Provide a maintenance task, for example: npm run mas -- "Fix the catalog filter"',
    );
  }

  return { task, dryRun };
}

// Seed every state field, invoke the compiled graph, and print only Coordinator's
// final report after the graph reaches END.
async function main(): Promise<void> {
  const { task, dryRun } = readTaskArgument();
  const result = await maintenanceGraph.invoke(
    {
      task,
      dryRun,
      stage: "new",
      next: "researcher",
      revision: 0,
      plan: "",
      handoff: "",
      research: "",
      implementation: "",
      testReport: "",
      finalReport: "",
    },
    // The graph can revisit Programmer and Tester, so set an explicit ceiling
    // above the maximum path length while still catching accidental cycles.
    { recursionLimit: 16 },
  );

  console.log("\n=== Maintenance workflow result ===\n");
  console.log(result.finalReport);
}

// Keep failures readable for terminal and VS Code users, including the most
// common remediation when Codex authentication is unavailable.
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nMaintenance workflow failed: ${message}`);
  console.error(
    "Confirm Codex is signed in (ChatGPT subscription or API key), then retry.",
  );
  process.exitCode = 1;
});
