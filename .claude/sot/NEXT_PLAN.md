# NEXT_PLAN.md — Provodnik: Phase 8 to Launch

> Live state only. The historical STATUS append-log (pre-2026-05-17, ~90 KB,
> entries 2026-04-06 -> 2026-05-03) is archived to
> `.claude/sot/_archive/NEXT_PLAN-history-pre-2026-05-17.md` — local-disk only,
> the SOT `_archive/` subdir is gitignored. Last reviewed: 2026-05-17.

## Current status — newest STATUS entry

> STATUS (2026-05-04): **launch-readiness finale — shipped Phase 8–11, PRODUCT_READY_2026-05-04.md written, ~7 commits since cc2007b.** Brain ran the second overnight loop iteration off the Phase 8 audit findings. T071-GATE took the all-pass branch after T071.1 + T071.2 each returned zero P0/P1 findings. Plans 58/59/60/61 all closed: Plan 58 traveler/guide audit fixes, Plan 59 notifications schema + LCP priority + История chip + listing-detail hero, Plan 60 explicit fetchPriority for Next.js 16 priority Image (4 files) + production listings re-seed (10 rows, 6 categories), Plan 61 dead Unsplash URL replacement (2 photo IDs across 4 rows). 5 deferral ADRs landed (ADR-054 priority-on-listing-detail, ADR-055 broken-Unsplash-seed-images, ADR-056 listings-search-id-name, ADR-057 inbox-empty-state-copy, ADR-058 stale-test-credentials). Single open finding: nightlife chip in `interests.ts` — T001 partial regression (adventure removed correctly, nightlife survived a post-T001 edit) — P2 cosmetic, not a launch blocker. Slack patch_42 ts=`1777856565.358759`, Telegram message_id=3536, hours=15 (cumulative loop). Cumulative across both overnight runs (2026-05-02→2026-05-04): ~42 commits, 94 ledger rows ticked, 17 findings files, 11 phase gates closed, 9 ADRs added. Next: launch.
