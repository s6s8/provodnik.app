# Finish Website — Tasks 1–3 Implementation Plan

> **For Hermes:** User explicitly requested Claude Code as the coding agent. Dispatch Claude Opus with project SOT, MCP, skills, and autonomous `/goal` + `/loop`. Hermes must monitor and independently verify before reporting done.

**Goal:** Finish the first three website-completion tasks only: richer demo seed data, full route QA pass, and existing warnings/accessibility cleanup.

**Architecture:** Treat homepage as the source-of-truth for simplicity/functionality/theme. Keep the existing page refactor intact. Make schema-aware demo data changes in a new migration only, run local DB/type verification if available, then perform production-mode visual/functional QA and clean non-blocking warnings that are safe to fix.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase migrations/RLS/Auth, Bun, Vitest, Playwright MCP, Claude Context7.

---

## Non-goals / hard constraints

- Do **not** push.
- Do **not** redesign the homepage.
- Do **not** start tasks beyond 1–3.
- Do **not** edit applied migrations; create a new dated migration for seed changes.
- Do **not** fabricate QA evidence. Save screenshots/reports from real runs.
- Follow `AGENTS.md`, `.claude/CLAUDE.md`, `.claude/sot/*`, and `.claude/rules/provodnik-orchestration.md`.
- Use Context7/MCP/research when library/API details are uncertain.
- Install additional dev tooling only if clearly needed, minimal, and committed only when appropriate.

---

## Task 1 — Richer demo seed data

**Objective:** Add schema-valid demo data so the app feels alive across search, messages, bookings, reviews, admin queues, favorites/referrals if enabled.

**Files / areas:**
- Read: `docs/qa/remaining-page-refactor-2026-06-28/seed-scope-notes.md`
- Read: `supabase/migrations/**/*.sql`
- Create: `supabase/migrations/YYYYMMDDHHMMSS_finish_demo_seed_data.sql`
- Regenerate if schema changes require it: `src/lib/supabase/database.types.ts`
- Add/update tests only if existing seed helpers/tests make it practical.

**Steps:**
1. Inspect current schema, enums, RLS-sensitive relationships, and existing seeded QA users/data.
2. Decompose seed rows by surface:
   - listing `exp_type` coverage for all search filter types
   - message threads/messages linked to seeded traveler/guide users
   - reviews for popular published listings
   - bookings in multiple statuses for traveler/guide/admin pages
   - moderation/dispute/admin queue rows if schema supports them
   - favorites/referrals only if flags/pages are active or data model is present
3. Create one new migration. Keep rows idempotent where practical.
4. Run available DB verification:
   - Prefer local Supabase reset/push if available and safe.
   - Run `bun run types` if schema/types need refresh.
5. Run targeted tests around affected data/query paths.
6. Commit with a human-written message.

**Acceptance:**
- Migration applies cleanly locally or a concrete environment blocker is documented.
- Seed rows are linked to QA users/known entities so protected pages render meaningful data.
- No raw secrets in output/docs.

---

## Task 2 — Full route QA pass

**Objective:** Verify the finished website in production mode across public, traveler, guide, and admin routes on desktop + mobile.

**Files / artifacts:**
- Create folder: `docs/qa/finish-website-2026-06-28/`
- Create report: `docs/qa/finish-website-2026-06-28/report.md`
- Save screenshots: public/protected route screenshots at 1280px and 375px where useful
- Save JSON/raw findings if a script is used.

**Steps:**
1. Build production app: `bun run build`.
2. Start locally: `bun run start --hostname 127.0.0.1 --port 3000`.
3. Use seeded QA users from `.env.local`/seed script pattern; do not print raw password.
4. Crawl/visit representative routes:
   - public: `/`, `/search`, `/ai`, `/destinations`, `/guides`, `/listings`, `/requests`, `/how-it-works`, `/trust`, `/become-a-guide`, policies/help if linked
   - traveler: `/account`, `/trips`, `/messages`, `/notifications`, feature-flagged cabinet links only if surfaced
   - guide: `/guide`, `/guide/inbox`, `/guide/bookings`, `/guide/listings`, `/guide/profile`, `/guide/calendar`, `/guide/reviews`, `/guide/stats`
   - admin: `/admin`, `/admin/dashboard`, `/admin/bookings`, `/admin/listings`, `/admin/guides`, `/admin/moderation`, `/admin/disputes`, `/admin/audit`
5. Check console errors, page errors, broken images, horizontal overflow, auth redirects, empty/thin states after Task 1.
6. Save concise report with pass/fail and remaining issues only.
7. Commit QA artifacts/report.

**Acceptance:**
- Real screenshots/report saved.
- Production-mode route QA has no blocking P0/P1 issues, or any blockers are documented with reproduction.

---

## Task 3 — Existing warnings/accessibility cleanup

**Objective:** Clean the known warnings that are safe and valuable before handoff.

**Known warnings:**
- `<img>` lint warnings in:
  - `src/components/shared/marketing-header.tsx`
  - `src/components/ui/avatar-stack.tsx`
- Dialog accessibility stderr warnings around missing description/aria-describedby.
- Test `act(...)` warnings in guide bid form tests if safe to fix.
- Mocked Supabase stderr warnings only if they are real code issues; do not overfit tests.

**Steps:**
1. Reproduce warnings with `bun run lint` and `bun run test:run`.
2. Fix warnings in priority order:
   - lint warnings first
   - real accessibility dialog description warnings second
   - noisy test act warnings only if fix is straightforward and not risky
3. Avoid unrelated UI changes.
4. Run targeted tests, then full verification.
5. Commit cleanup.

**Acceptance:**
- `bun run lint` has 0 errors and ideally 0 warnings.
- Full test suite passes. Remaining stderr warnings, if any, are documented as intentionally deferred with reason.

---

## Final verification required after tasks 1–3

Run and record results:

```bash
bun run typecheck
bun run lint
bun run test:run
bun run build
git diff --check
git status --short --branch
```

Final response to Hermes must include:
- commits created
- files/artifacts changed
- commands run + pass/fail
- route QA report path
- remaining risks/deferred work
