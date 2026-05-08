# Tripster v1 — cursor-agent prompt index

**Plan:** `docs/superpowers/plans/2026-04-12-tripster-v1.md`
**Spec:** `docs/superpowers/specs/2026-04-12-tripster-v1-design.md`

This directory contains one markdown prompt file per wave. Each prompt is self-contained and follows the §6.3 structure from Project CLAUDE.md: CONTEXT → SCOPE → KNOWLEDGE → TASK → INVESTIGATION → TDD → ENVIRONMENT → DONE CRITERIA.

**Dispatch command:**
```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  .claude/prompts/tripster-v1/<wave-file>.md \
  --workspace "D:\\dev2\\projects\\provodnik\\provodnik.app"
```

## Generation policy

Prompt files are generated **just-in-time** as each phase's preconditions land. Schema column IDs and trigger names may refine during Phase 1 review and locking them into prompt files prematurely would repeat ERR-011/012. Phases 0 and 1 ship now because they are unblocked and sequential.

## Phase 0 — Pre-flight

- [x] `00-01-preflight.md` — flag registry + worktree stubs + baseline

## Phase 1 — Schema megamigration

- [x] `01-01-schema-migration.md` — 20260413000001_tripster_v1.sql
- [x] `01-02-schema-rollback.md` — rollback script + staging dry-run
- [x] `01-03-types-regen.md` — regenerate TS types + Zod schemas

## Phase 2 — State machines ✅ DONE (implemented directly, no cursor-agent prompts needed)

- [x] `02-01-request-offer-sm.md` — done (merged to main, commit 353b362)
- [x] `02-02-review-reply-sm.md` — done (merged to main, commit 353b362)
- [x] `02-03-moderation-sm.md` — done (merged to main, commit 353b362)

## Phase 3 — PII gate + contact visibility ✅ DONE

- [x] `03-01-pii-mask.md` — done (PII mask utility, 26 tests, commit 3caaa7d)
- [x] `03-02-contact-visibility-gate.md` — done (chip + settings page, commit 8804e4e)

## Phase 4 — Editor megawave

- [x] `04-01-editor-shell.md` — MERGED (commit da2f937)
- [x] `04-02-shared-leaves.md` — MERGED (commit 3fb12dc)
- [x] `04-03-excursion-branch.md` — IN PROGRESS (agent running)
- [x] `04-04-to-08-type-branches.md` — IN PROGRESS (agent running)
- [x] `04-09-transfer-branch.md` — IN PROGRESS (agent running)
- [x] `04-10-tour-itinerary.md` — IN PROGRESS (agent running)
- [x] `04-11-tour-grids.md` — IN PROGRESS (agent running)
- [x] `04-12-tour-departures.md` — IN PROGRESS (agent running)

## Phase 5 — Traveler surfaces

- [x] `05-01-hero-search.md` — prompt written
- [x] `05-02-destination-page.md` — prompt written
- [x] `05-03-excursion-shape-detail.md` — prompt written
- [x] `05-04-tour-shape-detail.md` — prompt written
- [x] `05-05-transfer-detail.md` — prompt written
- [x] `05-06-booking-form.md` — prompt written

## Phase 6 — Thread, system events, offers, disputes

- [x] `06-01-system-events.md` — prompt written
- [x] `06-02-offer-card.md` — prompt written
- [x] `06-03-dispute-thread.md` — prompt written

## Phase 7 — Moderation queue + rejection cards

- [x] `07-01-admin-moderation-queue.md` — prompt written
- [x] `07-02-rejection-reply-moderation.md` — prompt written

## Phase 8 — Profile sub-pages

- [x] `08-01-profile-personal.md` — prompt written
- [x] `08-02-legal-information.md` — prompt written
- [x] `08-03-license-crud.md` — prompt written

## Phase 9 — Guide dashboard

- [x] `09-01-kpi-strip.md` — prompt written
- [x] `09-02-statistics.md` — prompt written
- [x] `09-03-orders-inbox.md` — prompt written
- [x] `09-04-calendar.md` — prompt written
- [x] `09-05-listings-management.md` — prompt written

## Phase 10 — Notifications

- [x] `10-01-bell-popover.md` — prompt written
- [x] `10-02-notification-delivery.md` — prompt written

## Phase 11 — Reputation

- [x] `11-01-four-axis-input.md` — prompt written
- [x] `11-02-aggregation-jobs.md` — prompt written
- [x] `11-03-reviews-list.md` — prompt written

## Phase 12 — Peripheral surfaces

- [x] `12-01-help-center.md` — prompt written
- [x] `12-02-favorites.md` — prompt written
- [x] `12-03-partner-cabinet.md` — prompt written
- [x] `12-04-referrals.md` — prompt written
- [x] `12-05-guide-quiz.md` — prompt written
- [x] `12-06-cross-sell-transfer.md` — prompt written

## Phase 13 — QA + rollout

- [x] `13-01-playwright-happy-paths.md` — prompt written
- [x] `13-02-flag-rollout.md` — prompt written

**Total:** 42 waves
