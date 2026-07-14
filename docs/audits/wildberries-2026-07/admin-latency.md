# Admin latency — before/after (Task A3, items 3 + 15)

Baseline `cbcffe67`. Measured by reading the query paths, not by a browser HAR — see
"What was not measured" below.

## Finding 1 — every admin navigation ran the whole dashboard

`src/app/(protected)/admin/layout.tsx` renders the sidebar badges on **every** admin page,
and called `getAdminNavCounts()`, which delegated to `getAdminDashboardStats()`.

| | Before | After |
|---|---|---|
| Count queries per admin navigation | **8** | **2** |
| Unbounded full-table counts (`bookings`) | **2** | **0** |
| Results computed and then discarded | **6 of 8** | 0 |

The nav shows exactly two numbers (pending guides, pending listings). It now costs exactly
two `head: true` count queries. `getAdminDashboardStats` is unchanged and still backs
`/admin/dashboard`, which legitimately renders all eight numbers.

The two `bookings` counts are the ones that degrade with scale: they are unfiltered
`count: exact` scans over the whole table, re-run on every click anywhere in the admin
console. That is the mechanism behind "аудит page feels dead" (item 3) — the page was
waiting on the booking table, not on its own data.

## Finding 2 — role save paid two serial round trips before it could start

`setUserRoleAction` awaited `getTargetForGuards`, then awaited `countOtherActiveAdmins`.
Both only need `targetUserId`, which is known before either runs.

| | Before | After |
|---|---|---|
| Serial guard round trips before the first write | **2** | **1** (`Promise.all`) |
| Queries to read the target's phone (A1 gate) | would have been **+1** | **0** |

The A1 phone gate could have added a third serial read. Instead `phone` and `full_name`
ride along on the row `getTargetForGuards` already fetches, so the new guard is free.

Write ordering is untouched: Auth first, then `profiles` (ERR-096). Only the reads moved.

## Regression check

`src/lib/supabase/moderation.test.ts` → "counts pending guides and listings with exactly
two queries and no full-table scans". The mock client **throws** if `getAdminNavCounts`
touches `bookings` or `disputes`, and asserts `from()` is called exactly twice. If someone
re-delegates the nav counts to the dashboard stats, that test fails.

```
bun run test:run -- src/lib/supabase/moderation.test.ts
→ Test Files 1 passed | Tests 21 passed
```

## What was not measured

No browser HAR / `console.time` trace was captured. Doing so needs a seeded admin session
against a running app, and the numbers it produces are wall-clock on one machine — not a
gate anyone can re-run. The query-count reduction above is the causal fact, it is exact,
and it is pinned by a test. A HAR would be a slower, less reproducible restatement of it.

If an operator wants the wall-clock delta for the PR narrative, capture it on the preview
deploy after this ships: DevTools → Network → filter `rest/v1`, click through
`/admin/users` → `/admin/audit`, and count the `count=exact` requests per navigation.
Expect 8 → 2.

## Explicitly not done (plan §7, risk register)

`bulkAction` still loops with per-user `await`s (same latency class, at scale). It is not
user-reported and the plan says do not silently fix it inside A3. Left for a future perf
pass.
