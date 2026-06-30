## 1. Screenshot Identity

Page/route: `/guide/profile`, section `О себе` → `Темы экскурсий`.

Visible UI: guide profile “about” form with theme chips selected for `История и культура` and `Гастрономия`; other visible chips include `Природа`, `Искусство`, `Необычные маршруты`, `Ночные прогулки`, `Активный отдых`, `Водные прогулки`, `Религия и духовность`. The save button sits on the same row as a raw red database error.

Screenshot-specific complaint: saving the “О себе” block fails with:

```text
new row for relation "guide_profiles" violates check constraint "guide_specializations_valid"
```

This is a real product-breaking save failure, not just a cosmetic issue.

## 2. UX/Product Diagnosis

The main failure is trust-breaking: the user chooses valid-looking themes from first-party UI, presses `Сохранить`, and gets an internal Postgres constraint name. From the guide’s perspective, the product is saying “you made a mistake,” but the mistake is in the app’s theme vocabulary.

Problems visible in the screenshot:

- Error clarity: raw DB error leaks `guide_profiles` and `guide_specializations_valid`. This is not actionable for a guide and makes the product feel unfinished.
- State ownership: the chips are presented as allowed options, but at least one submitted value is not accepted by the database. That makes the form’s affordance untrustworthy.
- Layout: the error appears inline immediately after the primary button, creating a crowded row. The red message competes with the button and looks like accidental developer output.
- Hierarchy: the theme explanation is reasonable, but the error should be a form-level alert under the section or above the button, not a loose paragraph beside the CTA.
- Spacing: the save row needs vertical breathing room after the chip group; in the screenshot the error visually touches the action area.
- Copy: `Темы экскурсий` is understandable, but the helper copy can be shorter and more direct. Current copy is slightly long for a dense settings form.
- Trust: “Религия и духовность” is visible as a normal selectable chip. If that value cannot be saved, users will assume the entire profile editor is unreliable.

## 3. Source/Code Investigation

Relevant source files:

- Page composition: [src/app/(protected)/guide/profile/page.tsx](/Users/idev/provodnik/src/app/(protected)/guide/profile/page.tsx:308) renders the `О себе` section and passes `profile?.specializations` into `GuideAboutForm`.
- Form UI: [src/features/guide/components/profile/guide-about-form.tsx](/Users/idev/provodnik/src/features/guide/components/profile/guide-about-form.tsx:160) renders `Темы экскурсий`, `InterestChipGroup`, save button, and inline error.
- Error placement: [guide-about-form.tsx](/Users/idev/provodnik/src/features/guide/components/profile/guide-about-form.tsx:174) places success/error text beside the button in one flex row.
- Server action: [src/features/guide/profile-actions.ts](/Users/idev/provodnik/src/features/guide/profile-actions.ts:62) filters submitted specializations against `THEMES`, then updates/inserts `guide_profiles`.
- Theme source: [src/data/themes.ts](/Users/idev/provodnik/src/data/themes.ts:14) defines current app slugs: `history_culture`, `nature`, `food`, `art`, `unusual`, `night`, `active`, `water`, `religion`.
- Chip source: [src/features/shared/components/interest-chip-group.tsx](/Users/idev/provodnik/src/features/shared/components/interest-chip-group.tsx:56) renders `INTEREST_CHIPS`, which now derives from `THEMES`.
- DB constraint: [supabase/migrations/20260502000001_add_guide_specializations.sql](/Users/idev/provodnik/supabase/migrations/20260502000001_add_guide_specializations.sql:10) allows older slugs: `history`, `architecture`, `nature`, `food`, `art`, `photo`, `kids`, `unusual`.
- Suspicious corrective SQL: [supabase/rollbacks/20260516000001_themes_canon_religion.sql](/Users/idev/provodnik/supabase/rollbacks/20260516000001_themes_canon_religion.sql:23) drops/re-adds the constraint, but it is under `rollbacks`, not normal `migrations`, and still only partially aligns with current `THEMES`.

Root cause: the app and database have divergent canonical theme IDs. Current UI/action can submit slugs like `history_culture`, `night`, `active`, `water`, `religion`; the original database check accepts `history`, `architecture`, `photo`, `kids` instead. Selecting visible chips can therefore violate the check constraint.

Existing tests do not catch this. [profile-actions.test.ts](/Users/idev/provodnik/src/features/guide/profile-actions.test.ts:38) submits `history_culture`, but the Supabase client is mocked, so no DB constraint compatibility is tested.

## 4. Redesign/Fix Strategy

Before:

- UI chip: `История и культура`
- Submitted slug: likely `history_culture`
- DB constraint: expects `history`
- Result: save fails with raw DB error.

After:

- One canonical theme vocabulary shared by request creation, guide profile, inbox matching, guide listings, public guide filters, and DB constraints.
- Save action rejects impossible values before Supabase update with a human message.
- DB accepts exactly the canonical values the UI can generate.
- Error is shown as a form alert, not as raw DB text beside the button.

Recommended canonical direction: keep the newer product vocabulary from `src/data/themes.ts` because it matches the screenshot and broader UI: `history_culture`, `nature`, `food`, `art`, `unusual`, `night`, `active`, `water`, `religion`.

Concrete DB migration strategy:

- Add a forward migration, not a rollback file.
- Drop `guide_specializations_valid`.
- Normalize existing stored values:
  - `history` → `history_culture`
  - `architecture` → either `history_culture` or `art`; product-wise `history_culture` is safer for “История и культура”
  - `photo` → likely remove or map to `art` only if product confirms photography belongs there
  - `kids` → remove unless a replacement exists in current UI
- Re-add check constraint for current `THEMES`.
- Apply the same normalization to `traveler_requests.interests` if that field participates in matching.

Before copy:

```text
new row for relation "guide_profiles" violates check constraint "guide_specializations_valid"
```

After copy for unexpected DB/theme failure:

```text
Не удалось сохранить темы. Обновите страницу и попробуйте снова.
```

Better validation copy if unknown values are submitted:

```text
Одна из выбранных тем больше не доступна. Обновите страницу и выберите темы заново.
```

Theme helper copy suggestion:

```text
Выберите темы, по которым хотите получать запросы в первую очередь. Остальные запросы останутся доступны.
```

Layout behavior:

- Keep the primary `Сохранить` button below the form fields.
- Put status feedback in a full-width row below or above the button.
- Use shadcn/Tailwind alert styling, no custom CSS classes.
- Example visual structure:
  - chip group
  - error alert, if any
  - action row with `Сохранить`
  - success text as small `text-success`, not competing with errors

Do not redesign the page identity. Keep the existing card, rounded chips, primary blue button, and shadcn/Tailwind system.

## 5. Implementation Checklist

1. Define the canonical theme contract.
   - Use `src/data/themes.ts` as the single frontend source.
   - Confirm whether old `architecture`, `photo`, and `kids` should map or be removed.

2. Add a forward Supabase migration.
   - Normalize `guide_profiles.specializations`.
   - Normalize `traveler_requests.interests` if matching depends on the same slugs.
   - Recreate `guide_specializations_valid` with current slugs from `THEMES`.
   - Keep the GIN index.

3. Harden `saveGuideAboutAction`.
   - Keep filtering allowed slugs.
   - If submitted values contain unknown slugs, return a friendly validation error before `.update()`.
   - Wrap database errors with user-safe Russian copy; do not return `error.message` directly for constraint failures.

4. Fix form feedback layout.
   - In [guide-about-form.tsx](/Users/idev/provodnik/src/features/guide/components/profile/guide-about-form.tsx:174), move error text out of the button row.
   - Render a form-level alert with `role="alert"`.
   - Keep `Сохранено` subtle and near the button.

5. Add tests.
   - Unit test `saveGuideAboutAction` with all current `THEMES` slugs, including `religion`, `night`, `active`, `water`, and `history_culture`.
   - Test unknown submitted specialization returns friendly validation copy and does not call Supabase update.
   - Component test that a failed save renders a human message, not `guide_profiles` or `guide_specializations_valid`.
   - Add/extend SQL migration tests if the project’s Supabase test setup supports constraint checks.

6. Browser checks.
   - `/guide/profile` desktop and mobile.
   - Select each visible theme, save, refresh, verify selected chips persist.
   - Save with `Религия и духовность` selected.
   - Confirm error/success messages do not overlap the button or overflow on narrow viewports.

Acceptance criteria:

- Saving `О себе` with any visible theme succeeds.
- No raw database error appears in the UI.
- `bun run typecheck` passes.
- `bun run lint` passes.
- No custom CSS classes or inline layout styles are added.

## 6. Risk Notes

- This is data/schema risk, not only UI risk. Changing theme slugs affects guide matching, `/guides` filters, request interests, inbox sorting, and seeded demo data.
- Do not “fix” by simply removing `Религия и духовность` from the UI unless product intentionally drops that category. The screenshot shows it as part of the current user-facing taxonomy.
- Do not remove the DB check constraint. It is useful as a final integrity boundary; it just needs to match the app contract.
- Do not return raw Supabase/Postgres errors to users. Log internally if needed, but show product copy.
- Be careful with approved/locked guides: [profile-actions.ts](/Users/idev/provodnik/src/features/guide/profile-actions.ts:40) currently lets approved guides update only `bio`; keep that behavior unless product changes verification rules.
- RLS should remain the security boundary. This fix should not broaden guide write permissions beyond the existing owner update path.