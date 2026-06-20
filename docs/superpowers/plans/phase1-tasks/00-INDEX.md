# Phase 1 — task ledger (the /goal reads THIS first each turn)
Source plan: docs/superpowers/plans/2026-06-19-phase1-conversion-spine-redesign.md
Rules: cursorSDK writes ALL code · Sonnet subagent verifies (critic≠coder) · orchestrator gates+merges per-page to main · DB autonomous via mini `ssh sshm` · decisions via Opus PM persona · NEVER ask the owner.
Mark `[x]` only when gates green AND Sonnet PASS AND merged to main. Do tasks in this order.

## goal-0 — handoff + measurement (pre-spine)
- [x] 00-handoff-verify     (orchestrator+Sonnet browser; cursorSDK only if gaps)
- [x] 01-funnel-events      (cursorSDK; needs DB events table — apply via mini)
- [x] 02-tripster-pass      (orchestrator research note; parallel, non-blocking)
## goal-1 — P0 trust/display bugs + restore /form + B broken pages
- [x] 10-rating-display     (P0-1)
- [x] 11-destinations-dedup (P0-2)
- [x] 12-destinations-cta   (P0-3)
- [x] 13-route-arrows       (P0-4)
- [x] 14-search-slugs       (P0-5)
- [x] 15-restore-form       (P0-6)
- [x] 16-booking-loading    (B-1)
- [x] 17-notif-prefs        (B-2)
- [x] 18-guide-stats        (B-3; may need DB — apply via mini)
- [x] 19-admin-badge        (B-4)
## goal-2 — S primitives then V spine pages (funnel-first), then sweep
- [x] 20-page-header        (S-1)
- [x] 21-loading-skeletons  (S-2)
- [x] 22-public-guide-card  (S-3)
- [x] 23-list-hero          (S-4)
- [x] 24-home               (V-7)
- [x] 25-form-refactor      (V-9)
- [x] 26-listings           (V-1)
- [x] 27-search             (V-5)
- [x] 28-listing-detail     (V-2)
- [x] 29-guides             (V-3)
- [x] 30-guide-profile      (V-4)
- [x] 31-auth               (V-8)
- [x] 32-destinations       (V-6; lowest priority, deferrable)
- [x] 33-efinal-sweep       (E; orchestrator+Sonnet browser)

