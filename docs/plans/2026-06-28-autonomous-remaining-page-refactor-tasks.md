# Autonomous Remaining Page Refactor Tasks

> **For Hermes:** Dispatch Claude Opus with `claude-cli-orchestration`; monitor stream/logs; independently verify diffs, screenshots, tests, and commits before reporting completion.

**Goal:** Finish the remaining high-value Provodnik app page fixes/refactors after Phase 1, using the homepage as the source-of-truth for simplicity, functionality, spacing, and theme.

**Architecture:** Work in small autonomous loops. Each loop selects the highest-priority remaining issue, implements the smallest safe fix/refactor, verifies it, documents evidence, and commits only if the work is clean. Do not churn pages already marked OK in the audit.

**Source of truth:**
- Homepage design plan: `docs/plans/2026-06-28-homepage-design-refactor-plan.md`
- Full app audit: `docs/qa/page-refactor-audit-2026-06-28/report.md`
- Existing screenshots/data: `docs/qa/page-refactor-audit-2026-06-28/`

---

## Design rules

- Use the homepage as SOT for cleanliness, spacing, confidence, theme, and focus.
- Do **not** copy full homepage hero treatment into protected/admin pages.
- Protected/admin pages should inherit token discipline, clear hierarchy, calm surfaces, and consistent empty states.
- Primary CTA remains blue/navy, not amber.
- Use semantic tokens and existing primitives; no new raw hex in components.
- Preserve auth, role, server actions, RLS assumptions, and data semantics.
- No push.

---

## Autonomous loop contract

Claude must operate as a self-evolving, self-promoting loop:

1. Read the latest repo state, this task packet, audit report, and design plan.
2. Select the highest-priority unfinished item from the task queue below.
3. Create/update a short progress log under `docs/qa/remaining-page-refactor-2026-06-28/progress.md`.
4. Implement one bounded item.
5. Verify with targeted tests/checks and screenshots when visual.
6. If verification passes, make a small commit for that item.
7. Promote itself to the next item and repeat.
8. Stop only when all P0/P1/P2 items below are done, verified, documented, and committed — or when a concrete blocker is proven with exact file paths, command output, and screenshot evidence.

Hard stop after no more than 6 implementation commits in one run; leave clear next tasks if more work remains.

---

## Task queue

### P0 — demo blockers / functional correctness

#### Task A: Admin `/account` role handling

**Issue:** Logged-in admin opening `/account` sees “Войдите в аккаунт”.

**Likely files:**
- `src/app/(protected)/account/page.tsx`
- auth/role helpers under `src/lib/auth/*` only if necessary
- existing account tests if present

**Expected fix:**
Either redirect admin users to `/admin`/`/admin/dashboard`, or render a minimal admin-safe account branch. Prefer redirect if consistent with existing role routing.

**Verification:**
- Add/update test for admin hitting `/account`.
- Browser or route check confirms logged-in admin no longer sees login prompt.

#### Task B: Feature-gated linked pages

**Issue:** Linked/demo pages render not-found states because feature flags are off:
- `/help`
- `/favorites`
- `/referrals`
- `/account/notifications`

**Expected fix:**
For demo/local, enable the flags in ignored `.env.local` if needed, but for product code also prevent visible navigation to disabled pages or make route behavior consistent. Prefer product-safe link hiding where links are generated, and document local demo flags.

**Likely files:**
- `src/lib/flags.ts`
- shared nav/footer/cabinet link components
- `.env.example` only for documented placeholders; never commit `.env.local`

**Verification:**
- Relevant tests for flag/link behavior where practical.
- Production browser crawl shows no linked “не найдена” pages for normal demo navigation.

### P1 — polish with direct audit evidence

#### Task C: `/ai` visual polish

**Issue:** Main funnel page has muddy/low-quality blurred background and feels weaker than homepage.

**Likely files:**
- `src/app/(site)/ai/page.tsx` or related feature components.

**Expected fix:**
Replace muddy background with cleaner homepage-aligned surface/photo/scrim treatment, improve form focus and contrast, keep conversion behavior unchanged.

**Verification:**
- 1280px and 375px screenshots saved in `docs/qa/remaining-page-refactor-2026-06-28/`.
- No console errors, no 375px horizontal overflow.

#### Task D: `/search` hero density

**Issue:** Large navy hero has too much dead right-side space.

**Likely files:**
- `src/app/(site)/search/page.tsx` or related search components.

**Expected fix:**
Compress hero or add useful search/filter affordance into empty space; maintain working search/filter behavior.

**Verification:**
- Existing search tests pass.
- 1280px and 375px screenshots saved.
- No console errors, no overflow.

### P2 — small loading/demo quality improvements

#### Task E: `/admin` loading state heading

**Issue:** Admin index/loading skeleton has no h1 mid-load.

**Expected fix:**
Add heading to loading/skeleton state or redirect faster to dashboard without reducing clarity.

**Verification:**
- Admin page test or snapshot where practical.

#### Task F: Demo data note / seed scope

**Issue:** Demo data is thin. This may be too large for this run.

**Expected fix:**
If low-risk, add documented seed TODOs or improve existing seed script only when clear. Do not invent fake production flows that conflict with schema.

**Verification:**
- Seed script still runs if touched.

---

## Required final verification before Claude stops

- `bun run typecheck`
- `bun run lint`
- Relevant targeted tests for touched areas
- `bun run build`
- Production browser QA for touched visual routes at 1280px and 375px
- `git diff --check`

Return final report with:
- commits made
- files changed
- screenshots saved
- commands run and results
- blockers / deferred items
