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

## Superpowers — Agent-Agnostic Skills

`obra/superpowers` skills apply to **Claude, Codex, and Cursor** — not just one agent.

**Claude invokes superpowers via the `Skill` tool** (not Read). Example:
- Before any bug fix → invoke `systematic-debugging`
- Before planning a feature → invoke `writing-plans`
- Before multiple parallel tasks → invoke `dispatching-parallel-agents`
- Before finishing work → invoke `verification-before-completion`

**When delegating to Codex or Cursor**, inject the skill file path into the prompt so the agent reads it:
```
Before writing any code, read and follow:
C:\Users\x\.agents\skills\superpowers\systematic-debugging\SKILL.md
```

Superpowers live in: `C:\Users\x\.agents\skills\superpowers\`
Key skills:
| Skill | When to use |
|---|---|
| `systematic-debugging` | Any bug, error, or unexpected behavior |
| `writing-plans` | Before planning a feature or phase |
| `dispatching-parallel-agents` | Multiple independent tasks |
| `finishing-a-development-branch` | Branch ready to merge |
| `verification-before-completion` | Before committing any work |
| `test-driven-development` | Writing tests |

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

**Phase 7 — Launch Prep** (in progress as of 2026-04-01)
Plan: `D:\dev\projects\provodnik\PLAN.md`
Handoff: `D:\dev\projects\codex-ops\state\handoffs\provodnik\handoff.md`

Phases 0–6 are fully complete. Remaining Phase 7 items:
- [ ] 7.4 Onboard 3–5 real guides in launch region
- [ ] 7.5 Create 5–10 seed requests
- [ ] 7.6 Domain/DNS — provodnik.app → production
- [ ] 7.7 SSL + CSP headers (security headers done; needs real domain)
- [ ] 7.8 Supabase daily backups enabled
- [ ] 7.10 Soft launch to closed group

Pending manual infra:
- `supabase db push` — 3 new migrations (messaging RLS, notifications RLS, storage buckets)
- Vercel env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

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
