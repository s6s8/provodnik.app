# Verification — launch-readiness fixes (2026-07-03)

Branch `opus/fix-launch-readiness` @ base `28b92058`. All commands run in
`/private/tmp/provodnik-opus-fix-launch`.

## Gate results

| # | Gate | Result |
|---|------|--------|
| 1 | `bun install --frozen-lockfile` | ✅ 1020 packages installed |
| 2 | `bun run typecheck` (`tsc --noEmit`) | ✅ 0 errors |
| 3 | `bun run lint` (`eslint`) | ✅ 0 errors/warnings |
| 4 | `bun run test:run` (vitest) | ✅ **227 files / 1129 tests passed** |
| 5 | `NEXT_TELEMETRY_DISABLED=1 bun run build` | ✅ Compiled successfully; all routes built |
| 6 | DB migration + RLS/RPC proof | ✅ validated against the real baseline schema (see below) |
| 6b | Live browser smoke | ⛔ blocked — see "Blocker" |

Test count went from 1122 (audit baseline) to 1129 (+7 net regression tests added).

## `git diff --stat`

```
 25 files changed, 765 insertions(+), 65 deletions(-)
```

Full list:

```
 docs/qa/launch-readiness-fix-20260702/OPUS_FIX_LAUNCH_ISSUES.md   | 128 ++++
 src/app/(protected)/admin/bookings/page.tsx                       |   2 +-
 src/app/(protected)/admin/listings/page.tsx                       |   2 +-
 src/app/(protected)/favorites/page.test.tsx                       |  41 ++-
 src/app/(protected)/favorites/page.tsx                            |  12 +-
 src/app/(protected)/guide/reviews/page.tsx                        |   2 +-
 src/app/(protected)/referrals/page.test.tsx                       |  17 +
 src/app/(protected)/referrals/page.tsx                            |  12 +-
 src/app/(site)/requests/[requestId]/page.test.tsx                 |  27 +
 src/app/(site)/requests/[requestId]/page.tsx                      |  11 +-
 src/components/discovery/NewGuideFrame.tsx                         |   2 +-
 src/components/discovery/__tests__/primitives.test.tsx            |   2 +-
 src/components/shared/cabinet-section-unavailable.tsx             |  42 +
 src/data/supabase/queries.test.ts                                 | 113 ++++-
 src/data/supabase/queries.ts                                      | 106 +++--
 src/features/admin/components/disputes/disputes-queue.tsx         |   2 +-
 src/features/bookings/components/BookingFormTabs.tsx              |   2 +-
 src/features/destinations/components/destination-detail-screen.tsx|   6 +-
 src/features/guide/components/excursions/guide-excursions-screen.tsx| 2 +-
 src/features/guide/components/public/guide-profile-screen.test.tsx|   4 +-
 src/features/guide/components/requests/guide-requests-inbox-screen.tsx| 2 +-
 src/features/guide/offer-actions.ts                               |   4 +-
 supabase/migrations/20260703000000_public_guide_detail_rpc.sql    |  66 +
 supabase/migrations/20260703000100_harden_public_traveler_requests.sql| 89 +
 supabase/tests/public_launch_hardening_test.sql                   | 134 +++++
```

## Gate 6 — DB / RLS / RPC proof

The two new migrations were applied to the running local Supabase (the real
baseline schema) **inside a single `BEGIN … ROLLBACK` transaction** — nothing was
persisted. The local stack is shared with a parallel worktree (same `project_id`),
so `db reset`/`db push` were deliberately avoided; a rolled-back transaction proves
the SQL against the true schema without clobbering the other job.

Assertions (all passed):

```
NOTICE:  ANON ASSERTIONS PASSED
NOTICE:  AUTH GUIDE ASSERTIONS PASSED
```

Covering:
- `get_public_guide_by_slug('v-active-guide')` → 1 row, `full_name` from `profiles`.
- `get_public_guide_by_slug('v-susp-guide')` → 0 rows (suspended account hidden).
- anon `SELECT … FROM traveler_requests` → 0 rows (raw table blocked).
- anon `SELECT … FROM v_public_open_requests` → 1 row (sanitized view readable).
- view has **no** `traveler_id` column; `notes` has email + phone masked and carries
  the `[контакт скрыт]` marker.
- authenticated guide `SELECT … FROM traveler_requests` (open) → 1 row (bidding path
  intact).

These are also encoded as a committed pgTAP suite,
`supabase/tests/public_launch_hardening_test.sql`, runnable via `supabase test db`
after the migrations are applied to a dedicated/local DB.

## Blocker — live browser smoke (gate 6b)

A full logged-in browser smoke (open a guide detail from the catalog, hit
`/favorites`, `/referrals`, browse public requests, probe anon raw access) could
**not** be run end-to-end because:

1. Fixes A and B require the two new migrations to be present in the DB the app
   talks to. The only reachable DB is the **shared** local Supabase stack used by a
   parallel job (same `project_id`/ports); applying migrations there would mutate
   another job's database. Prod is out of scope ("do not deploy").
2. Without applying the migrations, a live browser would still show the old
   (pre-fix) behaviour, proving nothing.

Instead, the data path for A/B is proven directly at the DB layer (rolled-back
transaction above) plus unit tests, which exercise the exact RLS/RPC logic a browser
click would trigger. Issues C/D/E are pure app-code/UI and are covered by the vitest
suite + production build. When the migrations are applied to a real environment, the
committed pgTAP suite + the existing SHIP_GATE browser checklist can promote this to
a live smoke.
