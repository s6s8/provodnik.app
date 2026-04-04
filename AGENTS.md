# AGENTS.md

## Mission
- Build and maintain `Provodnik` as a mobile-first web marketplace baseline.
- Prefer direct implementation over planning. Finish changes end-to-end when possible.
- Optimize for correctness, speed, and low-noise communication.

## Workspace
- App repo: `D:\dev\projects\provodnik\provodnik.app`
- Worktrees root: `D:\dev\projects\provodnik\worktrees`
- Main repo branch: `main`

## Current state
- Phase 0 (visual polish) — COMPLETE 2026-03-30
- Phase 1 (auth & data integrity) — COMPLETE 2026-03-31
- Phase 2 (core marketplace loop) — COMPLETE 2026-04-01. HEAD: `e94760a`
- Phase 3 (messaging + notifications) — COMPLETE 2026-04-01
- Phase 4 (trust + moderation) — COMPLETE 2026-04-01
- Phase 5 (SEO + content) — COMPLETE 2026-04-01
- Phase 6 (quality + devops) — COMPLETE 2026-04-01. HEAD: `c437207`
- Phase 7 (launch prep) — IN PROGRESS. Items 7.1–7.3, 7.9 done. Remaining: DNS, backups, guide onboarding, soft launch.

Key facts:
- Auth: Supabase Auth wired end-to-end. JWT role claims via custom_access_token_hook. proxy.ts protects all routes.
- 10 migrations applied to production. 3 new ones (messaging RLS, notifications RLS, storage buckets) need `supabase db push`.
- Storage: 4 buckets (guide-avatars, guide-documents, listing-media, dispute-evidence).
- Rate limiting: Upstash Redis — degrades gracefully if env vars not set.
- CI: GitHub Actions on every push (typecheck + lint + build).

## Stack
- `Next.js 16` App Router
- `React 19`, `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui` with `radix-nova` style
- `TanStack Query`
- `Supabase SSR/client helpers`
- `React Hook Form` + `Zod`

## Repo map
- `src/app`: routes, layouts, route groups
- `src/features`: feature UI and route-specific components
- `src/components/ui`: shared primitive UI; treat as stable
- `src/components/shared`: shared app chrome
- `src/components/providers`: app-level providers
- `src/lib`: env, utils, Supabase clients

## Worktree ownership
- `agent-foundation`: shared layout, app shell, providers, public primitives
- `agent-traveler`: `src/features/traveler`, `src/app/(protected)/traveler`
- `agent-guide`: `src/features/guide`, `src/app/(protected)/guide`
- `agent-admin`: `src/features/admin`, `src/app/(protected)/admin`
- `agent-data`: data contracts, `src/lib/supabase`, shared schemas/types

## Rules
- **UI/UX Pro Max:** Cursor skill at `.cursor/skills/ui-ux-pro-max/` ([upstream](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)). For design-led or greenfield UI, read `SKILL.md`, run the `search.py` design-system flow from this repo root, and use `--stack nextjs` / `--stack shadcn` for stack hints. Refresh via `npx uipro-cli@latest init --ai cursor`.
- Preserve the existing visual language unless the task is explicitly design-led.
- Avoid editing `src/components/ui/*` unless the task is truly shared-foundation work.
- Coordinate shared type or contract changes through the data layer.
- Keep imports on repo aliases like `@/components`, `@/features`, `@/lib`.
- Treat missing Supabase env as a supported local state; do not break the shell without need.
- Do not invent backend behavior that is not documented in code or product docs.
- Keep payment integration out of MVP; booking work should remain reservation-ready and policy-complete without a live payment processor.
- For Cursor and `cursor-agent`, use `--model auto` unless the user explicitly overrides it.
- Use `s6s8/provodnik.app-Tasks` issues as task records and GitHub Project as the live status board.
- Use worktrees as isolated coding spaces, not as the task ledger.

## Paperclip Execution Model
- `CEO` owns task-program direction and hiring decisions.
- `Provodnik Tracker` owns GitHub intake, issue normalization, and board hygiene.
- `CTO` owns technical sequencing, lane assignment, integration order, and stable workflow updates.
- Cursor lanes execute scoped code tasks inside the assigned worktree only.
- Codex lanes supervise, review, reconcile tracker state, and update durable docs.
- Slack dev notes must be derived from local source files in `codex-ops`; do not treat Slack as source of truth.
- If the design docs in `design/IMPLEMENTATION-GUIDE.md`, `design/LAYOUT.md`, and `design/STAKEHOLDER-FEEDBACK.md` sharpen or override older route assumptions, update planning docs and issue wording before delegating implementation.

## Runbook
- Install: `bun install`
- Dev: `bun dev`
- Build check: `bun run build`
- Checks: `bun run check` (typecheck + lint in one shot)
- DB reset: `bun run db:reset`
- Schema diff: `bun run db:diff`
- Type generation: `bun run types`
- **After any schema change**: run `bun run types` to regenerate `src/types/supabase.ts`

## Git rules
- **NEVER run `git push`** — pushing triggers Vercel production deployment
- Commit only. Report commit hash. Wait for user to say push.
- Commit format: `type(scope): description\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Documentation
- Before coding against Next.js, Supabase, TanStack Query, or Tailwind APIs — fetch current docs via Context7 MCP
- Never guess API signatures — use `mcp__plugin_context7_context7__resolve-library-id` then `query-docs`

## CSS rules
- Tailwind utilities + shadcn/ui components only — no custom CSS classes
- `globals.css` has ONLY design tokens and global resets (179 lines) — never add custom classes
- Design tokens exposed via `tailwind.config.ts` — use `bg-surface-high`, `text-primary`, `rounded-card` etc.
- Glass pattern: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`
- 23 shadcn/ui components in `src/components/ui/` — use them, don't hand-roll

## Verification (definition of done)
Every task must pass before marking complete:
1. `bun run build` — zero errors
2. `bun run typecheck` — zero errors
3. No custom CSS classes added — Tailwind utilities only
4. No inline `style={{}}` for things expressible as Tailwind
5. Commit exists with Co-Authored-By line

## Env
- Copy `.env.example` to `.env.local`
- Required for Supabase flows: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` is server-only
- `SUPABASE_DB_PASSWORD` is required for Supabase CLI schema push against the hosted database
- Legacy aliases `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are still supported
- The app shell should still run without Supabase credentials

## Source docs
- `README.md`: repo usage
- `WORKSTREAMS.md`: branch/worktree split
- `MVP.md`: scope
- `PRD.md`: product constraints
- `APP_STACK.md`: stack rationale
- `PROVODNIK-REPO-MEMORY.md`: repo-specific memory and status workflow
- `docs/process/orchestration-workflow.md`: issues, project, worktree, and Cursor execution flow
- `docs/process/paperclip-agent-contract.md`: Paperclip CEO, CTO, tracker, and executor contract
- `.cursor/rules/*`: Cursor project rules
- `docs/architecture/module-map.md`: module ownership and boundaries
- `docs/adr/*`: durable technical decisions

## Default job
- Read the relevant code first.
- Make the smallest coherent change that solves the task.
- Validate the change with the cheapest meaningful checks.
- Report outcome, affected paths, and any unverified risk.
- Keep stable memory in docs; keep live task status in issues/projects, not here.
- Treat the linked issue in `s6s8/provodnik.app-Tasks` as the task source of truth when one exists.
