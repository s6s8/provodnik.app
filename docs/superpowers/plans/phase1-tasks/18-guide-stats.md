# 18 guide-stats (B-3; DB via mini if needed) — cursorSDK
SCOPE: replace the "coming soon" placeholder with minimal REAL stats (read-only existing data).
FILES: src/app/(protected)/guide/stats/page.tsx (+ a query lib; + ONE read-only RPC only if an aggregate isn't queryable — apply via mini).
WHAT: show completed bookings count, avg review rating, review count, active listings count, using read-only queries + the locked card primitives. NO new aggregation tables. If a metric isn't queryable within this task, OMIT it (don't fake/defer the page).
VERIFY: live as a demo guide — real numbers, no "Скоро…".
COMMIT: `feat(guide): real guide stats dashboard`

