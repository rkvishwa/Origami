# Origami

Origami is a hackathon-first "Doc-to-App Engine" built with Next.js and the Vercel AI SDK. It ingests pasted text, text files, text-based PDFs, or a GitHub repository URL, then turns the source into an overview-first interactive workspace:

- a calculator for formulas, fees, or penalty rules
- a multi-doc repo dashboard with an interactive architecture graph and node inspector
- a document insight view for individual markdown files
- a deterministic package dashboard for `package.json` and key manifests
- a scenario simulator for branching playbooks and if/then manuals
- a PDF breakdown view with extracted sections, notable metrics, and source-aware follow-up actions
- a `v0 MVP` pane that drafts a mini-app brief with the official v0 model and can hand off to the v0 MCP server

## Stack

- Next.js 14 App Router
- Tailwind CSS
- Vercel AI SDK with `streamText`
- OpenAI via `@ai-sdk/openai`
- v0 Model API via `@ai-sdk/vercel`
- v0 MCP handoff via `@modelcontextprotocol/sdk`
- React Flow
- Recharts
- Zod
- `unpdf`

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Add your environment variable:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o
V0_API_KEY=
GITHUB_TOKEN=
```

`OPENAI_BASE_URL` is optional for the default OpenAI API. Set it when you want to point Origami at an OpenAI-compatible endpoint such as Microsoft Foundry.

Example:

```bash
OPENAI_API_KEY=your_foundry_key
OPENAI_BASE_URL=https://your-endpoint.example.com/openai/v1
OPENAI_MODEL=your-model-or-deployment-name
```

`GITHUB_TOKEN` is optional, but recommended if you plan to scan multiple public repositories and want to avoid stricter unauthenticated GitHub API rate limits.

`V0_API_KEY` enables the `v0 MVP` pane and the `Continue in v0` MCP handoff. Without it, the rest of Origami still works.

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Notes

- GitHub repo mode now scans recursive `.md` / `.mdx` docs plus key manifests such as `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and `tsconfig.json`.
- Repo dashboards show an `Overview` tab first, then one tab per included markdown or manifest file.
- Architecture nodes include evidence-backed explanations, related nodes, and file shortcuts in a persistent inspector.
- PDF mode supports text-based PDFs only. Scanned or image-only PDFs are intentionally out of scope for this MVP.
- The root route `/` now opens the full workspace directly, while `/workspace` remains available as a compatibility alias.
- The AI only returns typed tool payloads. The UI stays deterministic and React-rendered.
