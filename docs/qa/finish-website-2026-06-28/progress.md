# Finish Website — Tasks 1–3 Execution Checklist

Branch: `handover/macmini-final` (do NOT push). Started 2026-06-28 (UTC+3).
Plan: `docs/plans/2026-06-28-finish-website-tasks-1-3.md`

## Environment facts
- `.env.local` points at **production** Supabase (`yjzpshutgmhxizosbeef`) + `provodnik.app`. → never seed/destruct against this.
- Docker daemon down; colima installed → starting local Supabase sandbox for safe seed + QA.

## Task 1 — Richer demo seed data
- [x] Inspect schema: enums, tables (messages/threads, reviews, bookings, listings.exp_type, disputes, favorites), QA user IDs
- [x] Draft ONE new migration `*_finish_demo_seed_data.sql` (idempotent, attributable to QA users)
  - [x] listing exp_type coverage across FilterBar types
  - [x] message thread(s) traveler↔guide
  - [x] extra reviews on popular listings
  - [x] bookings in multiple statuses
  - [x] admin queue rows (moderation/dispute) gated to existing schema/flags
  - [x] favorites/referrals only if flags/data model present
- [x] Apply locally (`supabase db reset`) OR document concrete blocker
- [x] `bun run types` if schema changed (it won't — data only)
- [x] Targeted tests
- [x] Commit

## Task 2 — Full route QA pass
- [x] `bun run build`
- [x] `bun run start` against local Supabase
- [x] Crawl public/traveler/guide/admin routes @1280 + @375
- [x] Console/error/overflow/auth-redirect/empty-state checks
- [x] `report.md` + screenshots
- [ ] Commit

## Task 3 — Warnings / a11y cleanup
- [x] Reproduce via `bun run lint` + `bun run test:run`
- [x] Fix `<img>` lint warnings (marketing-header, avatar-stack)
- [x] Fix Dialog aria-describedby warnings
- [x] Fix test act() warnings if safe
- [x] Commit

## Final verification
- [x] typecheck / lint / test:run / build / git diff --check / git status
