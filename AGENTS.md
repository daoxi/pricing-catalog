# AGENTS.md — for AI coding agents

## Project tech stack
- Next.js
- Contentful
- TypeScript
- Tailwind CSS
- react-icons

## Rules (Do's and Don'ts)

### Pattern
- Keep the code clean, easy to understand, and write sufficient comments to explain what each block of code does.
- Split big monolithic code and organize it into reusable components/modules when suitable, use the root page component primarily for structuring child components.
- Prefer small, focused changes over broad refactors. Do not modify unrelated files.
- Minimize any unnecessary extra code, avoid scope creep and don't include any part I didn't specifically ask for.

### TypeScript
- Keep TypeScript strict, fix TypeScript errors instead of suppressing them.
- Do not use the `any` type for TypeScript variables, function parameters, or return types. Prefer `unknown` when the type is really uncertain.
- Prefer explicit interfaces/types for public APIs.
- Let TypeScript infer obvious local variable types, avoid unnecessary type assertions (`as`).

### Other
- Exclusively only use Tailwind CSS for component styling and keep it simple, avoid or minimize custom CSS if possible.
- Avoid using in-line SVGs for icons, instead use icons from a consistent icon set (such as Lucide Icons) from react-icons.
- Prefer `async`/`await` over `then`/`catch`/`finally` for asynchronous operations.

<!-- The following instructions are generated from create-next-app -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
