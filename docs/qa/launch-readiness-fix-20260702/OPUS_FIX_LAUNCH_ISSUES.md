# Opus task packet — fix launch-readiness blockers found by E2E audit

You are Claude Opus working in `/tmp/provodnik-opus-fix-launch` on branch `opus/fix-launch-readiness`, based on production main commit `28b92058`.

## Goal

Fix all launch-readiness issues found in the Opus/Hermes E2E audit without losing functionality:

1. **Critical:** public guide catalog shows guides, but public guide detail pages render 404 because detail query joins `profiles` directly under anonymous RLS.
2. **High:** anonymous clients can read raw `traveler_requests` rows directly, including internal IDs/raw notes. Public request discovery should use a safe public shape, not raw table exposure.
3. **High:** traveler cabinet routes `/favorites` and `/referrals` render visible cabinet 404 behind HTTP 200. Either implement proper V1 pages/empty states or hide/redirect consistently; prefer useful empty-state pages if straightforward.
4. **Medium:** terminology drift in user-visible UI: replace product UI language like `туристы`, `туры` where it conflicts with product terminology. Keep legally necessary terms in legal policies if context requires them.
5. **Medium:** invalid guide inbox detail/fallback should not produce confusing public 404 where a protected/role-safe not-found or redirect is expected.
6. Strengthen regression coverage so these do not return.

## Operating constraints

- You may edit product code, migrations, tests, and docs in this worktree.
- Do **not** push.
- Do **not** deploy.
- Do **not** print or write secrets.
- You may read `/Users/idev/provodnik/.env.local` only when needed for local/live verification; never copy it into this worktree and never print secret values.
- If database/RLS changes are needed, add a new Supabase migration and update tests/types if required.
- Preserve existing functionality and route intent.
- No broad redesign, no unrelated refactors.
- Commit the final verified fix with a human-style commit message if all gates pass.

## Source of truth to read first

- `AGENTS.md`
- `CLAUDE.md` if present
- `.claude/CLAUDE.md` if present
- `.claude/sot/INDEX.md`, `HOT.md`, `ERRORS.md`, `DECISIONS.md`, `PATTERNS.md` if present
- QA report from previous audit if available: `/tmp/provodnik-launch-audit/docs/qa/launch-readiness-opus-20260702/launch-readiness-report.html`
- Relevant code:
  - `src/app/(site)/guides/[slug]/page.tsx`
  - `src/data/supabase/queries.ts`
  - public request data/query paths under `src/app/(site)/requests*`, `src/features/requests*`, `src/data*`, `src/lib/supabase*`
  - `supabase/migrations/*`
  - protected route layouts and pages for favorites/referrals/guide inbox

Use Context7 for current Supabase/Postgres RLS/RPC and Next.js App Router behavior where helpful. Use sequential-thinking for root-cause and coverage planning.

## Required fixes and acceptance criteria

### A. Public guide detail fix

Acceptance:

- From logged-out visitor: `/guides` shows active/approved guides and clicking/opening a guide slug shows a real guide profile, not 404.
- Cyrillic slug detail works.
- Suspended/archived/demoted guide profiles remain hidden from public detail/search.
- Regression tests cover the RLS-safe data path and the account-state filters.

Likely approaches:

- Prefer a public `SECURITY DEFINER` RPC/view for guide detail with explicit allowlist + filters (`role='guide'`, `account_status='active'`, approved/available guide profile), mirroring `search_guides`.
- Avoid anonymous direct `profiles!inner` joins for public guide detail.

### B. Public traveler request data hardening

Acceptance:

- Public request discovery/detail continues to work with the intended safe fields.
- Anonymous client cannot directly select raw sensitive/internal request table data unless every exposed column is deliberately public.
- Raw `notes`/free-text should be masked/sanitized or returned only through a safe server/RPC shape as product allows.
- Regression tests/migration proof cover public access shape.

Use a migration/RLS/RPC if needed. Preserve request-first marketplace behavior.

### C. Traveler `/favorites` and `/referrals`

Acceptance:

- Authenticated traveler no longer sees cabinet 404 content on `/favorites` and `/referrals`.
- Either route has a real V1 empty state/useful page, or navigation hides disabled routes and route redirects/404s properly. Prefer useful empty state if simple.
- Tests cover no visible 404 copy behind HTTP 200.

### D. Terminology cleanup

Acceptance:

- User-visible product UI avoids forbidden terms where not legally necessary:
  - `турист` → `путешественник`
  - product UI `туры` → `экскурсии` or more precise copy
  - `заявки туристов` → `запросы путешественников`
- Legal policy pages can keep legally meaningful `туроператор/турагент/тур` if changing would reduce legal clarity, but product UI should be clean.
- Tests updated if they intentionally search for old text.

### E. Guide inbox invalid detail fallback

Acceptance:

- Invalid/protected guide inbox detail path does not leak into a confusing public request 404.
- It should show a role-appropriate protected not-found/empty state or redirect to `/guide/inbox` with safe messaging.
- Regression test if feasible.

## Verification gates

Run and capture results in `docs/qa/launch-readiness-fix-20260702/VERIFY.md`:

1. `bun install --frozen-lockfile` if dependencies are missing.
2. `bun run typecheck`
3. `bun run lint`
4. `bun run test:run`
5. `NEXT_TELEMETRY_DISABLED=1 bun run build`
6. A Playwright/live or production-local smoke that proves:
   - public guide catalog → guide detail works for at least one slug, including Cyrillic slug if data exists;
   - traveler `/favorites` and `/referrals` do not render cabinet 404;
   - public request discovery/detail still works;
   - direct anonymous raw request access is blocked or sanitized according to your chosen fix.

If a gate is blocked by external credentials/service state, record the exact blocker and still run every independent gate.

## Deliverables

Write:

- `docs/qa/launch-readiness-fix-20260702/FIX_SUMMARY.md` — what changed, why, files touched, migration notes, manual deploy/migration steps.
- `docs/qa/launch-readiness-fix-20260702/VERIFY.md` — commands/results and browser smoke evidence.
- Screenshots under `docs/qa/launch-readiness-fix-20260702/screenshots/` if browser checks are run.

Return final summary with:

- commit hash if committed;
- files changed;
- verification results;
- any unresolved risks/blockers.
