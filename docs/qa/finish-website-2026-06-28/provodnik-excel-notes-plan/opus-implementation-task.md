# Opus Implementation Task — Excel/Codex Screenshot Fixes

You are Claude Opus working in `/Users/idev/provodnik` as the implementation executor for the Provodnik Excel review fixes.

## Mission

Implement all fixes from the user's Excel review notes and screenshot-by-screenshot Codex analysis. This is a production polish/bug-fix pass across auth, account, guide onboarding/profile, request detail, admin guide verification, and avatar/account menu.

## Non-negotiable rules

- Read `CLAUDE.md`, `.claude/CLAUDE.md`, `AGENTS.md`, and relevant SOT before editing.
- Do not push.
- Commit only after all required verification passes.
- Commit message: `fix(product): resolve excel review findings`
- No automation/co-author trailers.
- Use `bun`, never npm/yarn.
- Tailwind/shadcn only. No custom CSS classes, no `<style>` blocks, no inline layout styles.
- Preserve Provodnik brand colors and the existing clean design system.
- Do not make broad unrelated refactors.
- Do not weaken Supabase RLS. RLS remains the security boundary.
- If a DB/schema migration is needed, add a forward migration and update generated types if the project flow requires it.
- Keep fixes source-aware and tested. Do not hide symptoms only.

## Required MCP / plugins / evidence approach

Use the strongest available reasoning and verification tools:

- Use sequential-thinking MCP for decomposition and risky decisions.
- Use Context7 for relevant APIs/libraries before edits where API behavior matters:
  - Next.js App Router / Server Actions as needed.
  - Supabase/Postgres constraints/migrations as needed.
  - React form/testing behavior as needed.
- Use Playwright MCP/browser verification for rendered UI after implementation.
- Use frontend-design / ui-ux-pro-max judgment for layout/copy polish.
- Include the Context7 library IDs/docs/signatures you used in your final report.

## Source evidence to read first

Primary evidence:

- `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-notes.md`
- `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/codex-screenshot-analysis/combined-codex-screenshot-analysis.md`
- Extracted screenshots:
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image1.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image2.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image3.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image4.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image5.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image6.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image7.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image8.png`
  - `docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image9.png`

Treat Codex analysis as guidance, not gospel. Verify against source and rendered behavior.

## Decomposed fixes

### 1. Avatar/account menu cleanup

User note: avatar menu has questionable/duplicate links.

Fix:

- Remove or demote unused/confusing avatar menu entries:
  - `Мои поездки` / `/bookings` if route is not meaningful for current product.
  - `Приглашения` / `/referrals` if route is not meaningful.
  - `Избранное` / `/favorites` if route is not meaningful.
  - `Уведомления` in avatar menu if the header already has a notifications icon.
- Keep clear role/account actions only.
- Ensure traveler/guide/admin menus still expose the necessary account/profile/logout paths.
- Add/update tests around rendered account menu links if existing patterns support it.

Acceptance:

- Avatar menu no longer duplicates notifications.
- No dead/confusing account-menu links are exposed.
- Role-specific navigation still works.

### 2. Auth trust panel copy and contrast

User notes:

- `/auth`
- `Бесплатно для путешественников` confusing.
- `Честную цену` confusing.
- `Поддержка на каждом шаге` vague.
- Form/layout looks crooked.

Fix:

- Replace vague trust claims with concrete safe copy.
- Preferred direction:
  - `Регистрация и заявка бесплатны`
  - `Проверяем профиль и документы гида`
  - `Цена и условия видны до выбора`
  - `Поможем с заявкой и бронированием`
- If richer title/description layout works cleanly, use it; otherwise keep concise single-line bullets.
- Ensure headline/supporting text contrast is clearly readable on navy panel.
- Keep mobile behavior sane.

Acceptance:

- Old confusing phrases are gone.
- Copy does not overpromise free trips/services.
- Auth panel is readable and aligned at desktop widths.

### 3. Auth form footer/layout and phone reuse prevention

User note: phone already used by one account can be used to create another account.

Fix:

- Improve auth form footer/toggle alignment so signup/login toggle reads as intentional action, not loose grey text.
- Prevent duplicate phone signup at backend level, not only UI.
- Normalize phone values before comparison/storage enough to prevent trivial duplicates.
- Add a safe forward DB migration if uniqueness must be enforced in DB.
- Before adding uniqueness, inspect existing seed/demo data paths and avoid breaking migration/reset. Handle null/empty phone correctly.
- Server action should return friendly Russian validation copy, not raw DB errors.
- Update tests for duplicate phone handling.

Acceptance:

- Existing phone cannot create a second account.
- Error message is human-readable.
- Null/blank optional phone remains allowed if product still treats phone as optional.
- Auth tests cover this.

### 4. Traveler account page tautology and cursor/focus glitch

User notes:

- `/account`
- Tautology: `Кабинет путешественника`, `Профиль`, `Профиль путешественника`.
- Second blinking cursor outside field when entering name.

Fix:

- Make page identity singular and clear.
- Preferred H1: `Профиль путешественника`.
- Remove/rewrite redundant eyebrow/section heading/checklist title.
- If completion checklist remains, rename to something like `Готовность профиля` and fix copy placement.
- Investigate the cursor/focus artifact in rendered UI. If real, fix focus/input layout at component usage level. Do not casually edit shadcn primitives.

Acceptance:

- No stacked duplicate profile/cabinet headings.
- No visible second cursor/focus artifact in focused/unfocused states.
- Tests updated for revised copy.

### 5. Become-a-guide hero and benefits rewrite

User notes:

- `/become-a-guide`
- Remove `Зарабатывайте на авторских экскурсиях` because all excursions are authorial / phrase does not make sense.
- Remove block that does not reflect reality.
- Add: `Проводник работает только с аккредитированными гидами`.

Fix:

- Rewrite guide onboarding around accreditation/verification and quality, not unrealistic earning claims.
- Remove or replace the inaccurate benefits/income block.
- Add visible positioning that Provodnik works only with accredited/verified guides, but avoid claiming enforcement beyond actual product flow if not fully guaranteed. If data flow uses verification, align copy to that.
- Keep current brand/design system.

Acceptance:

- No unrealistic earnings/author-excursion claim remains.
- Accreditation/verified-guide positioning is clear.
- Layout remains polished desktop/mobile.

### 6. Guide profile legal form spacing / save button overlap

User note:

- `/guide/profile`
- `Сохранить` button overlaps/encroaches on text in legal/details area.

Fix:

- Inspect the legal section rendered layout.
- Fix button/status/text spacing with Tailwind layout utilities only.
- Ensure mobile wrapping works.

Acceptance:

- Save button does not overlap or crowd text/status.
- Legal section has clear form/action hierarchy.

### 7. Guide profile theme specialization DB constraint

User note:

- `/guide/profile` `О себе` save fails with raw DB error:
  `new row for relation "guide_profiles" violates check constraint "guide_specializations_valid"`

Fix:

- Root-cause and fix canonical theme IDs across UI, server action, DB constraint, seeds/tests.
- Current visible UI includes chips such as history/culture, gastronomy, nature, art, unusual, night, active, water, religion. Any visible chip must be saveable.
- Add a forward migration to align `guide_specializations_valid` with current frontend vocabulary and normalize old stored values safely.
- Inspect related request interests/matching if shared taxonomy is used; align where necessary.
- Server action must validate unknown submitted values before Supabase update and return friendly Russian error.
- UI must not show raw DB/Postgres errors.
- Update tests to cover all visible/current theme slugs, including values previously rejected.

Acceptance:

- Saving `О себе` with any visible theme succeeds.
- No raw constraint/table name appears in UI.
- DB constraint still exists and matches canonical app taxonomy.

### 8. Request detail breadcrumb

User note:

- `/requests/[requestId]`
- Breadcrumb shows `Поездки > Россия > Москва`; not clickable and wrong context.

Fix:

- Replace wrong `Поездки` breadcrumb context with product-appropriate request context.
- Make breadcrumb items clickable where appropriate.
- Avoid implying trip/bookings area if route is request detail.
- Preserve location context if useful, but use correct labels.

Acceptance:

- No `Поездки > Россия > Москва` breadcrumb on request detail.
- Breadcrumbs are meaningful and clickable where expected.
- Tests/render checks cover target route.

### 9. Admin guide verification queue failure/states

User note:

- `/admin/guides` on admin account shows failure card: `Действие не выполнено`; user wanted to verify if a guide application arrived.

Fix:

- Root-cause the admin guides route failure state.
- Fix data loading/action handling so admin can see guide verification submissions.
- Make states explicit and useful:
  - submitted/pending applications
  - draft/incomplete guide profiles if shown
  - empty state: no submitted applications
  - error state: actionable friendly copy with retry/context
- Do not leak internal DB errors.
- Add/update tests for loader/state rendering/action errors if existing patterns support it.

Acceptance:

- Admin `/admin/guides` no longer shows generic unexplained failure in normal seeded/demo/admin scenario.
- Admin can tell whether a guide verification application arrived.
- Empty/error/pending states are clear.

## Verification requirements

Run and pass at minimum:

```bash
bun run typecheck
bun run lint
```

Also run targeted tests for edited areas. Prefer existing project scripts/patterns, for example:

```bash
bun run test -- <changed test files>
```

If schema/migrations changed:

- Run or explain the best available DB verification.
- Prefer `bun run db:reset` only if local Supabase environment is available and safe. If unavailable, run SQL/static checks and report blocker honestly.
- Regenerate/update DB types if project conventions require it.

Rendered/browser verification:

Use Playwright MCP or local browser checks for at least:

- `/auth` desktop + mobile
- `/account` focused/unfocused name field
- `/become-a-guide` desktop + mobile
- `/guide/profile` legal section + about/theme save layout
- `/requests/[requestId]` target detail route or seeded equivalent
- `/admin/guides`

Capture screenshots under:

`docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/implementation-screenshots/`

If live data/auth makes a route impossible, document exact blocker and use the closest seeded/demo route/test.

## Final report contract

Return a concise final report with:

- Files changed.
- Each fix completed mapped to the 9 categories above.
- Migrations/types changed, if any.
- Tests/commands run with pass/fail.
- Browser routes checked and screenshot paths.
- Any blockers or intentionally deferred items.
- Commit hash if committed.

## Stop condition

/goal Do not stop until all nine categories above are implemented, relevant tests/verifications pass, browser checks/screenshot artifacts are produced where feasible, and a verified commit exists. If a category cannot be completed, prove the blocker with exact evidence and complete everything else.
