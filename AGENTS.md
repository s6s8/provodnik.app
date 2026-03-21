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
- This is an MVP baseline, not a finished product.
- Public marketing shell exists.
- Protected placeholder routes exist for `traveler`, `guide`, and `admin`.
- Supabase helpers exist, but most product logic is still to be built.

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
- Checks: `bun run lint`, `bun run typecheck`
- Use `bun run build` after routing, config, or framework-level changes.

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
