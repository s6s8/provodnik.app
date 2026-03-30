# Provodnik — Claude Code Instructions

## Agent Stack — Read This First

Claude is the **instruction giver**, not the code writer.

| Task type | Who does it |
|---|---|
| Feature work, bug fixes, refactors | `codex exec --dangerously-bypass-approvals-and-sandbox "..."` |
| Small CSS / copy fixes (1-2 lines) | Claude directly |
| Library / API questions | Context7 MCP → then answer |

**Never write feature code yourself. Fire Codex.**

Codex command pattern:
```bash
codex exec --dangerously-bypass-approvals-and-sandbox "
Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
Workspace: D:\dev\projects\provodnik\provodnik.app

<task description>

ACCEPTANCE: bun run build passes. Do NOT push — commit only.
"
```

## Documentation — Always Fetch Fresh Docs

When the task involves any of these libraries, **use Context7 MCP before writing any code**:
- Next.js, React, React 19 APIs
- Supabase, @supabase/ssr, Supabase Storage, Supabase Realtime
- TanStack Query v5
- Tailwind CSS v4
- shadcn/ui, Radix UI
- Zod v4

Never guess API signatures. Context7 takes 10 seconds. Hallucinated APIs waste hours.

## Git Rules — Non-Negotiable

- **NEVER push** unless user explicitly says "push" or "deploy"
- Pushing to `origin/main` triggers an immediate Vercel production deployment
- Always end with: `git commit` → report commit hash → wait for user to say push
- Commit message format: `type(scope): description` — Co-Authored-By line required

## CSS Rules

- **All styles in `src/app/globals.css` only** — no per-component `<style>` blocks, no Tailwind inline classes for custom values, no inline `style={{}}` for layout
- Use CSS custom properties from `:root` — never hardcode hex values or pixel values that duplicate tokens
- Design tokens are in `D:\dev\projects\provodnik\DESIGN.md` — read before touching any visual code

## Package Manager

- **bun only** — never npm or yarn
- `bun dev`, `bun run build`, `bun run typecheck`, `bun run lint`

## Current Phase

**Phase 1 — Auth & Data Integrity** (next to implement)
Plan: `D:\dev\projects\provodnik\PLAN.md`
Handoff: `D:\dev\projects\codex-ops\state\handoffs\provodnik\handoff.md`

Key Phase 1 tasks:
- 1.1 Supabase Auth end-to-end (email magic link) — uses `@supabase/ssr` already installed
- 1.2 `middleware.ts` protecting `/traveler/*`, `/guide/*`, `/admin/*`
- 1.3 Role-based route guards
- 1.4 Profile creation on first login
- 1.5 Guide onboarding → persists to Supabase
- 1.6 RLS audit on all tables
- 1.7 error.tsx + not-found.tsx per route
- 1.8 loading.tsx skeletons

## Key Commands

```bash
bun dev                          # local dev server
bun run build                    # production build check
bun run typecheck                # TS check only
bun run lint                     # ESLint
bun run db:reset                 # reset local Supabase + apply all migrations + seed
bun run db:diff                  # diff current schema → new migration file
bun run types                    # regenerate src/types/supabase.ts from local DB
bun run check                    # typecheck + lint in one shot
```

## Supabase Local Dev

```bash
supabase start                   # start local Supabase stack
supabase db reset                # apply all migrations + seed.sql
supabase db diff --schema public # preview schema changes
supabase migration new <name>    # create new migration file
supabase gen types typescript --local > src/types/supabase.ts
```

Migrations live in `supabase/migrations/`. After any schema change, regenerate types.

## Architecture Rules

- Data queries: service layer pattern — functions in `src/data/` accept a typed Supabase client, work from both server and client context
- Server components fetch directly via `createServerClient` — no useEffect for SSR data
- Interactive/filtered data via TanStack Query with Supabase cache helpers
- RLS is the security boundary — never rely on application-layer filtering alone
- File uploads: presigned URL pattern via Server Action → direct browser upload to Supabase Storage

## What Claude Handles Directly

Only these, without Codex:
- Reading files and answering questions about the codebase
- Updating `PLAN.md`, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`
- Writing Codex prompts
- Slack updates (via `codex-ops/scripts/slack_post.py`)
- Git operations (commit, status, log — never push)
- Small isolated fixes (1-2 lines CSS, copy changes)
