# Open tasks 06.07.26 — Ledger

Source goal: `docs/qa/open-tasks-20260706/GOAL.md`

Base: current `main` (`c0e6bfbd`), worktree branch `worktree-open-tasks-fix`.
Per-commit gate (pre-commit hook, re-synced from tracked `scripts/pre-commit.sh`):
typecheck + lint:ratchet + full `test:run` — green on every commit below.
Pre-existing `lint:gid-literal` failure on `main` is unrelated (7 «Гид» literals in
untouched files) — flagged, not introduced here.

## Rows

| Row | Priority | Status | Cause | Fix | Commit | Evidence |
|---|---|---|---|---|---|---|
| #35 | P0 SEC | FIXED | Suspend only flipped `account_status`; GoTrue session stayed valid + 5 SECURITY DEFINER write RPCs bypass RLS with no status check → suspended user with a valid token could still accept/counter/dispute/review/message | GoTrue ban (`ban_duration`) on suspend/archive + clear on reactivate (both callsites); migration `20260706120000` adds fail-closed `assert_active_account()` guarding all 5 write RPCs; applied locally + ledger repair (never db push); traveler-request RLS guards `20260706093000` applied locally | `251179db` | pgTAP `suspended_account_write_lockout_test.sql` (3/3); unit tests for ban/unban; `pg_policy` dump shows 5 guarded policies |
| #38 | P0 | FIXED | Admin users LIST showed masked email only (detail already unmasked); raw email fetched but not exposed on `AdminUserListItem` | Expose raw `email` on list item + render `email ?? maskedEmail`; keep audit-actor mask; fix stale "contacts hidden" copy | `1be11c8e` | Playwright: list shows real emails — `shots/38-admin-users-unmasked-1280.png` |
| #40 | P1 | FIXED | `makeError` `instanceof Error` discarded PostgREST plain-object errors → "Unknown Supabase error" across ~25 callsites | Preserve real message + carry PG code on `.name`; keep `Error` type (no ripple) | `5309bf4c` | Unit test `queries-core.test.ts` (3/3). Banner not reproducible on current schema — root defect was log-blinding |
| #39 | P1 | FIXED | Avatar `profiles` UPDATE had no `.select()` → 0-row update resolved `error:null` = silent success | Add `.select("id")`, throw on 0 rows | `ef8c380f` | Unit test `avatar-action.test.ts` (0-row→ok:false, owner-row→ok:true) |
| #34 | P1 | FIXED | Browser `getUser()` pre-check gated on any throw/null, raced `proxy.ts` cookie refresh → spurious re-login | Delete client pre-check in both forms; action returns `code:'auth_required'`; gate only on that | `4876a85c` | Unit tests: `auth_required` on null-user + on getUser throw. `shots/34-request-form-1280.png` |
| #37 | P1 | FIXED | Post-signup blank page = SSR auth read throwing in layout | Already hardened `77f6d728` + global/segment error boundaries; added missing regression tests + catch on homepage auth gate | `f1dbbb3a` | 2 new server-auth degrade tests (getUser error + throw → not-authenticated) |
| #24 | P1 | FIXED (already) | Pre-fix loader didn't select/map `avatar_url` | Already fixed in HEAD; added regression test at the breaking layer | `ed8983af` | Unit test asserts `getGuideBySlug` maps `avatar_url`; view exposes `p.avatar_url` |
| #33 | P2 | FIXED (already) | Bio previously inherited `text-center` | Already fixed by hero restructure: `guide-profile-screen.tsx:106` parent `flex flex-col items-start text-left` | — (no code change) | Code: line 106; no `text-center` layout in file |
| #36 | P2 | RESOLVED — WON'T FIX | Filled badge `px-2.5` insets standalone-badge TEXT ~10px vs column edge (`ui/badge.tsx`) | No code change: mira design verdict = marginal/not a real defect; the eyebrow px-0 precedent doesn't apply to filled chips, and `-ml`/`flush` "fixes" would create a visibly lopsided pill (real regression for an imperceptible nit). All 3 flagged sites are standard chip-row-vs-text juxtapositions | — (no code change) | mira-design-director verdict: severity marginal, recommend none, signs off on as-is |

## MUTATION LOG

- Initial ledger created from operator goal.
- STEP0 recon: dev-server `.env.local` points at a **remote** Supabase — admin-UI data is
  remote, distinct from local docker DB (3 qa users). All migrations applied to **local only**.
- Runtime disproved several hints (code drifted since goal authored): #24, #33 already fixed in
  HEAD (launch-hardening commits); #37 primary already fixed by `77f6d728`; #40 & #39 user-facing
  symptoms not reproducible — real defects were latent (log-blinding, silent 0-row update). Rows
  re-scoped to root-cause + regression test.
- PROACTIVE: `.git/hooks/pre-commit` was STALE (referenced non-existent `lint:canon`/`lint:dead`,
  blocked all commits). Re-synced from tracked `scripts/pre-commit.sh`. Local-only .git change.
- PROACTIVE: `main` fails `bun run lint:gid` (pre-existing, 7 «Гид» literals) — separate P2 cleanup.
- #35 expanded beyond hint: added SECURITY DEFINER RPC guards (the real RLS-bypass chokepoint) via
  fail-closed `assert_active_account()` + pgTAP proof.
</content>
