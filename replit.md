# LEXANDR — Deep Research Intelligence

Autonomous deep research engine for the ZENTR3 ecosystem — synthesizes strategic intelligence, scientific references, and structured reports powered by Claude (Anthropic).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lexandr run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Replit Anthropic integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 at `/api/*`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + wouter + shadcn/ui + TanStack Query
- AI: Anthropic claude-sonnet-4-6 via Replit AI Integration, max_tokens 8192

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (conversations, messages, research-sessions, research-messages, research-reports)
- `artifacts/api-server/src/routes/research/index.ts` — all LEXANDR research endpoints
- `artifacts/api-server/src/lib/lexandr-system-prompt.ts` — LEXANDR AI identity/system prompt
- `artifacts/lexandr/src/` — React frontend (pages/, components/, hooks/)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks + Zod schemas used in both API server and frontend
- SSE streaming: research message POST streams `data: {"content":"..."}` chunks, terminates with `data: {"done":true}`; frontend uses raw fetch + ReadableStream (not generated hook)
- Codegen fix: `lib/api-spec/package.json` codegen script post-processes `lib/api-zod/src/index.ts` to remove duplicate exports that Orval regenerates
- DB schema: template exports `conversations`/`messages` (not `conversationsTable`/`messagesTable`) — use exact export names
- Model: always `claude-sonnet-4-6`; no temperature param; max_tokens 8192

## Product

- **Command Center** — live dashboard with session count, query volume, report count, domain distribution
- **New Session** — initialize a research session with topic, domain, and optional context
- **Session Chat** — real-time SSE-streamed conversation with LEXANDR; generate a structured report from any session
- **Intel Reports** — archive of all generated reports with domain badges
- **Report Detail** — structured sections: executive summary, scientific basis, market analysis, strategic insights, technical recommendations, risk analysis, frameworks, sources

## Gotchas

- DB schema uses `conversations` / `messages` (not `conversationsTable` / `messagesTable`)
- Always run codegen after changing `openapi.yaml` before typechecking
- API server binds to port 8080 (set by workflow via `PORT` env); frontend uses a randomly assigned port
- SSE endpoint cannot use the generated hook — must use raw `fetch` + `ReadableStream`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
