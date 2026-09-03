# Multi-agent development system

## Overview

This multi-agent system (MAS) is designed for future maintenance/development of this catalog app. The workflow in `mas/index.ts` is a coordinator-led LangGraph state
machine. It defines four logical roles: one Coordinator and three workers. The
workflow runs sequentially; the roles are not four persistent or concurrent
processes.

## Hierarchy

```text
Coordinator (only routing authority)
├── Researcher (read-only discovery and documentation research)
├── Programmer (implementation and repairs)
└── Tester (independent review and verification)
```

Workers never route directly to another worker and cannot end the workflow.
Each worker returns its report to the Coordinator, which prepares the next
handoff, requests a repair, or produces the final report.

## Role specifications

| Role | Model | Reasoning | Sandbox | Live web | Prompt | Responsibility |
| --- | --- | --- | --- | --- | --- | --- |
| Coordinator | `gpt-5.6-sol` | `high` | `read-only` | Disabled | `agents/coordinator.md` | Plan the work, prepare focused handoffs, evaluate worker reports, route the workflow, and write the final report. |
| Researcher | `gpt-5.6-terra` | `medium` | `read-only` | Enabled | `agents/researcher.md` | Inspect the repository and primary documentation, searching the web, and recommend a minimal implementation and validation approach. |
| Programmer | `gpt-5.6-sol` | `high` | `workspace-write` | Disabled | `agents/programmer.md` | Implement the current handoff or repair request with the smallest necessary code and documentation changes. |
| Tester | `gpt-5.6-terra` | `high` | `workspace-write` | Disabled | `agents/tester.md` | Independently review the implementation, run relevant checks, and return exactly one `VERDICT: PASS` or `VERDICT: FAIL` line. |

(Tester receives workspace-write access because lint, type-checking, and build
tools may create artifacts. Its role prompt still prohibits source-code edits.)

## Authentication

You need an active ChatGPT subscription (e.g. ChatGPT Plus) that supports the models used in this multi-agent system.

The SDK uses `OPENAI_API_KEY` from `.env.local` or the process environment when
available. Otherwise, it reuses the local ChatGPT login shared by the Codex CLI
and VS Code extension (this is what I'm using).

## Running the workflow

```powershell
npm run mas -- "Enter your prompt here"
```

## Example outputs 

They are stored under `/agent/examples/`.

## Files/directories layout

- `/mas/index.ts`: state schema, role runtime configuration, routing, and entry point.
- `/agents/`: agent role definition (behavior and boundaries) markdown-based files
- `/agent/examples/`: example commands and their real outputs.
- `/AGENTS.md`: repository-wide coding instructions inherited by the roles.


