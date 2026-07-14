# PLAYBOOK — observed truths (this repo, this box)

v1 (2026-07-13, Wildberries execution). Inherits the design-run playbook
(`.goal-design-run-20260713/PLAYBOOK.md`); everything below is re-verified or new.

## Commands that actually work

- `bun install` — required in a fresh worktree; node_modules is NOT inherited (~5s, 847 pkgs).
- `bun run typecheck` → `tsc --noEmit`. Baseline clean.
- `bun run lint` → eslint. Baseline **0 errors, 21 warnings** (pre-existing Supabase-boundary
  warnings in `src/data/**`). Warnings are ratcheted: a NEW warning fails the commit hook.
- `bun run test:run` → vitest. Baseline at `cbcffe67`: **224 files / 1176 tests**.
- `bun run build` → next build.
- Local Supabase: `colima start` then
  `bunx supabase start -x vector,logflare,studio,imgproxy,inbucket,edge-runtime,supavisor`
  (plain start fails: vector bind-mounts the docker socket).

## Truths

- **The pre-commit hook runs typecheck + lint-ratchet + the FULL vitest suite.** Every commit is
  already gated. Cost: ~30s/commit. It runs against the WORKING TREE, so a partial-file commit
  is still gated by the whole tree.
- **The local DB container is named after `supabase/config.toml`'s project id, NOT the worktree
  dir.** Here: `supabase_db_pvd-agent-fix-missing-alert-dialog`. `docker exec <that> psql -U
  postgres -d postgres` is the fastest way to run real SQL. Do NOT `docker run postgres:15` to
  get a psql — it pulls ~400MB and this box has <4GB free.
- **Disk is tight (3.9 GiB free).** Do not pull images. Do not leave stray containers.
- `supabase db reset` applies `supabase/migrations/` to the local DB — the real way to prove a
  migration, and it takes ~60s.
- Repo `.env.local` does NOT exist in a fresh worktree (it is gitignored). The one in the main
  checkout points at **PRODUCTION** — never point tests at it.

## Banned moves

- Never `git push`, never touch `main`.
- Never `supabase db push` against prod (ledger is truncated — landmine).
- Never weaken a test or delete an assertion to make a gate pass. If a test pins the OLD
  behaviour that a card deliberately reverses, UPDATE it to the new contract and keep its
  protective intent (see C1: the "hide the catalog" tests became "keep /destinations out, and
  never let the public nav use the guide's bare «Экскурсии» label").
- Never `bunx shadcn init` here (rewrites components.json/globals.css). `shadcn add` only.
- Never `git add -A` while a background agent is running — it sweeps their in-flight files into
  your commit. Stage by explicit path, and `git reset` before every `git add` (a hook-rejected
  commit leaves the index populated).

## Heuristics that paid off this run

- **Trace every reader AND writer of a column before migrating its values.** The plan's grep for
  B3 (`grep '"active"' src | grep -i listing`) missed the guide calendar
  (`.eq("status","active")` — the word "listing" isn't on that line) and the guide-facing
  `bulkSetStatus`. Migrating without them would have emptied every guide's calendar. Grep the
  VALUE, then read each hit; don't grep the value AND a keyword.
- **Read each "failing" grep hit before believing it.** Two of the `active` hits were correct:
  `listing_tour_departures.status` is a different table, and `ExcursionRecord.status` is a
  hardcoded UI view-model field that never reaches the DB.
- **A shared constant is the root-cause fix for literal drift.** B3's bug was a writer and a
  reader disagreeing on a string. `PUBLIC_LISTING_STATUS` makes that impossible; two literals
  would just drift again.
- **Rehearse destructive SQL against the real schema with a false-positive fixture.** The A2
  runbook's whole safety argument is "a guide genuinely named like their email is excluded".
  That claim is worth nothing until a fixture proves it. It did.
- **Check the guard row you already fetch before adding a query.** A1's phone gate needed
  `profiles.phone`; `getTargetForGuards` was already SELECTing that row. Adding two columns beat
  the plan's extra round trip — in the very action A3 was speeding up.
- **When the plan states a fact, verify it.** C7's plan text said the triggers are gated by
  `FEATURE_TR_NOTIFICATIONS`. They are not. Three of the seven have no caller at all.

## v2 — the two that cost the most (learn these)

- **`bun run build` is NOT covered by the pre-commit hook.** The hook runs typecheck + lint +
  the full vitest suite. It does **not** build. Framework-level rules are invisible to all three:
  a `"use server"` module may only export **async** functions, and a sync export there ships
  through green tests and fails only at `next build` (F-04). Run the build before believing a
  branch is green.
- **A Next.js `redirect()` does not return 307 when the render is already streaming.** It returns
  **200** with `NEXT_REDIRECT` and `<meta http-equiv="refresh" content="1;url=/target">` in the
  body. `curl -w '%{http_code}'` therefore reports "200 = broken" for a redirect that works
  perfectly, and `curl -L` will not follow a meta-refresh either. To verify a redirect:
  `curl -s <url> | grep -c 'url=/target'`, or use a real browser (F-06).
- **Registering a value in a registry ≠ applying it.** `NAV_FLAG_BY_HREF` gained `/listings`, the
  unit test on the filter passed, and the entry still rendered with the flag off — because
  `SiteHeader` filtered only the account menu, never the primary nav. Grep every CONSUMER of a
  registry when you add to it, and prove appear/disappear behaviour by rendering the DOM, not by
  testing the helper in isolation (F-05).

## Serving the built app locally (the strongest cheap proof)

```bash
# worktree-local .env.local pointing at LOCAL supabase (never the repo one — it targets PROD)
bunx supabase status -o env      # -> API_URL, ANON_KEY, SERVICE_ROLE_KEY
bun run build && PORT=3100 bun run start
curl -s localhost:3100/ | grep -c 'Готовые экскурсии'
```

Kill stale servers with `pkill -9 -f next-server` and **verify the port is free** — a failed
restart silently leaves the OLD server bound, and you will spend twenty minutes debugging a build
you are not actually running. Use a fresh port when in doubt.

Seeded E2E (the real end-to-end proof, and it is worth it):
```bash
bun scripts/seed-test-users.mjs .env.local     # needs SUPABASE_SECRET_KEY + QA_SEED_PASSWORD
E2E_ALLOW_MUTATIONS=1 bun run playwright       # 14/14 incl. the request-first lifecycle
```

## Parallel subagents in one worktree

Works well (5 at once) IF: disjoint file lists, agents NEVER run git write commands, and the
integrator stages by explicit path. Two agents legitimately sharing a file is fine — split it
at commit time with `printf 'y\nn\n...' | git add -p <file>` (hunk order is stable) so each card
still gets one commit. Verify with `git diff --cached <file>` before committing.

Give each agent: the exact files it owns, the exact files it must NOT touch, the TDD order, and
the literal proof commands. They reliably report back when the brief is wrong about the code —
three did this run, and all three were right.
