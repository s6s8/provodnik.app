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

## v3 (after F-02, F-03)
- **`git reset` before every `git add`.** A hook-rejected commit leaves the index populated; the next `git add` inherits it and silently widens the commit. Verify with `git diff --cached --name-only` before committing. (F-03)
- **One concern per commit, including copy.** Renaming brand copy inside a structural task broke a test that pinned the string. Leave out-of-scope fixes to the task that owns them. (F-02)
- The pre-commit hook typechecks + tests the WHOLE repo, so a commit is blocked by any other agent's in-flight file. When running agents in parallel, wait for the suite to go green (`until bun run test:run; do sleep 30; done`) before committing anything.
- Parallel agents in one worktree works well (5 ran at once) IF: disjoint file lists, no git writes by agents, and the integrator stages by explicit path.

## v4 (final — after T-41)
- **The browser gate beats the token gate.** Every grep and every contrast-script pair was green while axe still found two real AA failures (muted on surface-low; placeholder text). A math gate only proves the pairs you thought of. Always finish with a real render + axe. (D-07)
- **Check each text token against the DARKEST surface it sits on**, not just the canvas. `--surface-low` (#F4F4F2) is darker than the canvas and is where cards/toolbars put muted text.
- **Placeholder text is text.** WCAG 1.4.3 does not exempt it; axe will flag it.
- Naive line-greps produce false positives for a11y gates (`size="icon"` with the aria-label on the next line; a test that ASSERTS a banned string is absent; a booking id `#abcdef12` matching a hex-colour pattern). Parse the tag, and read every "failing" match before believing it.
- Running the mutation-gated lifecycle E2E is safe and worth it ONCE a local seeded Supabase stack exists (`E2E_ALLOW_MUTATIONS=1`). It is the only end-to-end proof the request-first flow still works after a UI refactor.
- Parallel subagents in ONE worktree scale well (6 at once) if: disjoint file lists, agents never run git write commands, and the integrator (a) waits for the suite to go green before committing and (b) `git reset`s before every `git add`.
