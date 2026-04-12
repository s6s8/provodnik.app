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
Read /mnt/rhhd/projects/provodnik/provodnik.app/AGENTS.md first.
Workspace: /mnt/rhhd/projects/provodnik/provodnik.app

<task description>

ACCEPTANCE: bun run typecheck && bun run lint && bun run build all pass. Do NOT push — commit only.
"
```

## Skills — Claude Code Native

Claude invokes skills via the `Skill` tool. Available skills:

| Skill | When to use |
|---|---|
| `ui-ux-pro-max` | Any UI/UX design, component building, visual work |
| `simplify` | After writing code — review for quality and reuse |
| `update-config` | Configure hooks, automated behaviors in settings.json |
| `claude-api` | Anything using Anthropic SDK or Claude API |

**When delegating to Codex or opencode**, these skills are not available — inline the relevant guidance directly in the prompt.

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
- **Before every commit:** run `bun run typecheck && bun run lint` — both must exit 0
- **After every merge:** run `bun run lint` to confirm 0 errors before marking task done

## CSS Rules

- **Tailwind utilities + shadcn/ui components only** — no custom CSS classes, no per-component `<style>` blocks, no inline `style={{}}` for layout
- `globals.css` contains ONLY design tokens (`:root`, `.dark`) and global resets — never add custom classes there
- Design tokens are exposed via `tailwind.config.ts` — use token names (`bg-surface-high`, `text-primary`, `rounded-card`) not raw `var()` references
- Glass morphism pattern: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`
- shadcn/ui components: 23 installed in `src/components/ui/` — use them instead of hand-rolling buttons, badges, avatars, etc.

## Package Manager

- **bun only** — never npm or yarn
- `bun dev`, `bun run build`, `bun run typecheck`, `bun run lint`

## Current Phase

**Tripster V1 — Complete** (all 42 waves merged to main as of 2026-04-12)
Feature flags doc: `docs/tripster-v1-rollout.md`

All Tripster V1 waves (Phases 0–13, 42 waves) are merged to main.
Production DB is fully migrated (all migrations applied via Supabase MCP).

Remaining soft-launch items (manual):
- [ ] `vercel login` then run `.claude/set-vercel-env.sh` — sets RESEND_API_KEY + 13 feature flags on production/preview
- [ ] Onboard 3–5 real guides in launch region
- [ ] Create 5–10 seed requests
- [ ] Domain/DNS — provodnik.app → production
- [ ] Supabase daily backups enabled
- [ ] Soft launch to closed group

Env vars already set in `.env.local` (local dev) and to be synced to Vercel:
- `RESEND_API_KEY` — email sending (forgot password, transactional)
- `FEATURE_TRIPSTER_V1=1` and all sub-flags per `docs/tripster-v1-rollout.md`

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
