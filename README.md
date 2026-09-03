# Pricing Catalog

A statically generated smartphone pricing catalog built with Next.js, Contentful, TypeScript, and Tailwind CSS.

## Local development

Copy `.env.example` to `.env.local`, add the Contentful delivery credentials and a long random revalidation secret, then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contentful ISR webhook

The catalog uses eager on-demand regeneration for Contentful changes. Create a Contentful webhook with:

- Method: `POST`
- URL: `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET`
- Triggers: publish, unpublish, and delete events for Product and Layout Option entries
- Payload: Contentful's default entry payload

Product events revalidate the homepage and the matching `/products/{slug}` page. Layout Option events revalidate the homepage.

For local testing, use:

```text
http://localhost:3000/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET
```

Do not expose the secret in client-side code or commit it to the repository.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Install Chromium once, then run the automated accessibility check:

```bash
npx playwright install chromium
npm run test:a11y
```

Axe checks the rendered homepage for automatically detectable WCAG 2.1 Level A and AA violations. It does not replace manual accessibility testing.

## Maintenance multi-agent workflow

The repository includes a deliberately small [LangGraph](https://docs.langchain.com/oss/javascript/langgraph/overview) workflow for future maintenance. Its only graph nodes are four role-based Codex agents:

```text
                         ┌────────────┐
                  ┌─────▶│ Researcher │──────┐
                  │      └────────────┘      │
START ──▶ Coordinator ◀──────────────────────┤
                  │      ┌────────────┐      │
                  ├─────▶│ Programmer │──────┤
                  │      └────────────┘      │
                  │      ┌────────────┐      │
                  └─────▶│   Tester   │──────┘
                         └────────────┘
                               │
                    Coordinator ──▶ END
```

Every worker reports back to Coordinator; workers never route directly to one another. Coordinator plans and creates each handoff, Researcher inspects the codebase and current web documentation, Programmer edits the workspace, and Tester reviews the result and runs lint, type checking, and build checks. A failed test goes through Coordinator for at most two focused repair passes.

The implementation is in [`mas/index.ts`](mas/index.ts), and the short role prompts are in [`agents/`](agents/). Researcher and Coordinator run read-only. Programmer uses workspace-write access, while Tester receives workspace-write access only because Next.js checks create build artifacts. Only Researcher receives live web access.

### Authentication

The workflow uses the [Codex TypeScript SDK](https://learn.chatgpt.com/docs/codex-sdk.md), which controls the local Codex runtime. `OPENAI_API_KEY` is optional:

- **ChatGPT subscription:** sign in to Codex in VS Code with ChatGPT. The IDE extension and Codex CLI share the cached local login, so leave `OPENAI_API_KEY` unset.
- **Platform API billing:** optionally put `OPENAI_API_KEY` in `.env.local` or export it in the terminal before running the workflow. The exported terminal value takes precedence.

These are alternative authentication paths: a ChatGPT subscription does not become Platform API credit. Node.js 18 or newer is required.

### Run it from VS Code with Codex

1. Open this repository in VS Code and open the Codex sidebar. If needed, choose **Sign in with ChatGPT** on the signed-out screen and finish the browser flow. See the official [Codex authentication guide](https://learn.chatgpt.com/docs/auth.md).
2. Commit or stash work you do not want an automated maintenance run to touch.
3. Validate the four-node routing without authentication or file changes:

   ```bash
   npm run mas:dry-run -- "Describe the maintenance task"
   ```

4. Start a real run in the integrated terminal:

   ```bash
   npm run mas -- "Fix the catalog filter reset behavior"
   ```

   You can also ask Codex in the sidebar: `Run npm run mas -- "<task>" in the integrated terminal, monitor the four roles, and summarize the final report.`

5. Review the resulting diff in Source Control. The workflow prints each node as it starts and ends with Coordinator's final verified report or its remaining blockers.

The VS Code Command Palette also exposes Codex commands, and the sidebar gear opens shared Codex settings such as sandbox and model choices; see the official [IDE command reference](https://learn.chatgpt.com/docs/developer-commands.md?surface=ide).
