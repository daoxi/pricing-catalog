

## Multi-agent maintenance workflow

The LangGraph workflow in `mas/index.ts` runs each role in a fresh Codex thread.
Model and reasoning assignments are explicit so the workflow does not depend on
a developer's global Codex defaults.

| Role | Model | Reasoning | Sandbox | Live web | Responsibility |
| --- | --- | --- | --- | --- | --- |
| Coordinator | `gpt-5.6-sol` | `high` | `read-only` | Disabled | Plan work, prepare focused handoffs, route between workers, and produce the final report. |
| Researcher | `gpt-5.6-terra` | `medium` | `read-only` | Enabled | Inspect the repository and current primary documentation, then recommend a minimal implementation and validation approach. |
| Programmer | `gpt-5.6-sol` | `high` | `workspace-write` | Disabled | Implement the Coordinator's handoff with the smallest necessary source and documentation changes. |
| Tester | `gpt-5.6-terra` | `high` | `workspace-write` | Disabled | Independently review the implementation, run relevant checks, and return exactly one `VERDICT: PASS` or `VERDICT: FAIL` line. |

All roles use `approvalPolicy: "never"`, the repository root as their working
directory, and the role instructions in `agents/<role>.md`. Workers return to
the Coordinator after every stage. Failed tests may be sent back to the
Programmer for at most two repair revisions.

### Usage examples
Usage examples with real outputs are stored under `/agent/examples/`
