# PLAYBOOK — observed command truths (this repo, this box)

v1 (2026-07-13, P0 recon)

## Commands that actually work
- `bun install` — required in a fresh worktree; node_modules is NOT inherited (4.6s, 845 pkgs).
- `bun run typecheck` → `tsc --noEmit`. Baseline: clean.
- `bun run lint` → `eslint`. Baseline: **0 errors, 21 warnings** (pre-existing Supabase-boundary warnings). Warnings are NOT a gate; errors are.
- `bun run test:run` → vitest, 232 files / 1195 tests, ~25s wall. Baseline green.
- `bun run build` → next build. Baseline green (~2 min).
- Contrast gate: the `node -e` script in plan §7.2 — exit 0 required.

## Banned moves
- Never `git push` / never touch `main`.
- Never weaken a test or delete an assertion to make a gate pass.
- Never run `supabase db push` against prod (migration ledger is truncated — landmine).
- Never point dev/E2E at the repo root `.env.local` (it targets PROD; writes would hit live data).
- Do not run `bunx shadcn init` here (it rewrites components.json/globals.css); `shadcn add` only.

## Heuristics
- Grep gates are the cheapest true proof for mechanical sweeps; run the exact gate from plan §7.3 before committing a sweep task.
- `space-y-N` → put `flex flex-col gap-N` on the same element. Identical rendering for uniform children.
- Tailwind v4: tokens are CSS-first in `src/app/globals.css` (`:root` + `@theme inline`). No tailwind.config.
- Stale `.next` in agent worktrees gives spurious Turbopack failures — `rm -rf .next` before trusting a build.

## Local seeded browser target (safe, no prod writes)
1. `colima start`
2. `bunx supabase start -x vector,logflare,studio,imgproxy,inbucket,edge-runtime,supavisor` (plain start fails: vector bind-mounts docker socket)
3. worktree-local `.env.local` from `supabase status -o env` + `QA_SEED_PASSWORD`
4. `bun scripts/seed-test-users.mjs .env.local`
5. `E2E_ALLOW_MUTATIONS=1 bun run playwright …`
Trap: any `qa-` guide slug 404s by design (slug guard).

## v2 (after F-01)
- **NEVER `git add -A` while a background agent is running.** It sweeps their in-flight files into your commit. Stage by explicit path; verify `git status --short` shows only files you touched. (F-01)
- The pre-commit hook runs typecheck + lint-ratchet + the FULL vitest suite (~40s). So every commit is already gated — no need to run the chain manually before committing, only the task's own grep proof.
- The lint ratchet compares against a baseline (0 errors / 21 warnings). New warnings fail the commit; the 21 existing ones are fine.
- Subagents are reliable for single-file/short-file-list mechanical edits with an exact grep gate; give them the gate command and require literal output.
