## 1. Screenshot Identity

Route/area: `/account`, traveler profile.

Visible UI: page header with eyebrow “КАБИНЕТ ПУТЕШЕСТВЕННИКА”, H1 “Профиль”, action “Мои запросы”, avatar upload block, traveler profile form, and the beginning of a second section titled “Профиль путешественника”.

Screenshot-specific complaint: duplicate/tautological headings and a possible second cursor/input glitch near the “Имя” field.

## 2. UX/Product Diagnosis

The page currently says the same thing three ways:

- “Кабинет путешественника”
- “Профиль”
- “Профиль путешественника”

That makes the hierarchy feel accidental. A traveler does not learn whether this is account settings, public traveler info, or a completion checklist. The lower “Профиль путешественника” heading is especially confusing because it appears after the Save button, so it reads like a second profile page starting below the form.

The “Мои запросы” button in the header is useful, but visually competes with the page title. On this screen it should be secondary navigation, not a peer action to editing profile data.

The avatar success state “Аватар обновлён” is clear but looks like a disabled input/pill because it sits in a bordered rounded container. It should read as a status alert or toast-style message, not another form field.

The suspected second cursor near “Имя” is likely the focused text input caret rendered at the far-left text position, not a second input from source. Still, the screenshot makes it look like a vertical artifact outside the rounded input. This needs a browser check with the field focused and unfocused.

Spacing is mostly acceptable, but the stacked cards plus bottom checklist create a long form with no clear “what changed / what is incomplete” state. The checklist only validates one field, so it adds weight without much value.

## 3. Source/Code Investigation

Primary files:

- [`src/app/(protected)/account/page.tsx`](/Users/idev/provodnik/src/app/(protected)/account/page.tsx:117)
  - Traveler route renders the repeated hierarchy.
  - `PageHeader` uses `eyebrow="Кабинет путешественника"` and `title="Профиль"` at lines 119-121.
  - Completion checklist is rendered after the form at line 142.

- [`src/features/profile/components/traveler-profile-form.tsx`](/Users/idev/provodnik/src/features/profile/components/traveler-profile-form.tsx:59)
  - Main editable form.
  - Fields: name, home city, bio, languages, birth year.
  - Possible focus/caret visual should be checked around `Input` usage at lines 66-71.

- [`src/app/(protected)/profile/_components/avatar-upload-block.tsx`](/Users/idev/provodnik/src/app/(protected)/profile/_components/avatar-upload-block.tsx:75)
  - Avatar card and success/error alerts.
  - Success alert currently appears under the avatar block at lines 108-111.

- [`src/features/profile/components/traveler-profile-completion-checklist.tsx`](/Users/idev/provodnik/src/features/profile/components/traveler-profile-completion-checklist.tsx:13)
  - Renders the lower “Профиль путешественника” section heading.
  - Current incomplete copy says “Укажите имя в форме ниже”, but the checklist is below the form, so the direction is wrong.

- [`src/lib/profile/traveler-profile-completion.ts`](/Users/idev/provodnik/src/lib/profile/traveler-profile-completion.ts:16)
  - Defines `TRAVELER_PROFILE_SECTION_2_TITLE = "Профиль путешественника"`.
  - Checklist only checks `full_name`.

Related tests:

- [`src/app/(protected)/account/page.test.tsx`](/Users/idev/provodnik/src/app/(protected)/account/page.test.tsx:25)
- [`src/features/profile/components/traveler-profile-form.test.tsx`](/Users/idev/provodnik/src/features/profile/components/traveler-profile-form.test.tsx:13)
- [`src/lib/profile/traveler-profile-completion.test.ts`](/Users/idev/provodnik/src/lib/profile/traveler-profile-completion.test.ts:18)

Persistence/schema:

- Traveler profile fields live on `profiles`.
- Migration: `supabase/migrations/20260601000001_traveler_profile_fields.sql`
- Loader: [`src/lib/profile/load-traveler-profile.ts`](/Users/idev/provodnik/src/lib/profile/load-traveler-profile.ts:7)
- Save action: [`src/features/profile/account-settings-actions.ts`](/Users/idev/provodnik/src/features/profile/account-settings-actions.ts:1)

## 4. Redesign/Fix Strategy

Before:

- Eyebrow: “Кабинет путешественника”
- H1: “Профиль”
- Separate lower section: “Профиль путешественника”
- Checklist copy: “Укажите имя в форме ниже…”

After:

- Eyebrow: remove, or use neutral “Личный кабинет”
- H1: “Профиль путешественника”
- Subtitle: “Эти данные видят гиды, когда отвечают на ваши запросы.”
- Header action remains: “Мои запросы”, but keep as outline/secondary.

Recommended Russian copy:

```text
Профиль путешественника
Эти данные видят гиды, когда отвечают на ваши запросы.
```

Replace the bottom checklist with a compact status near the top of the form or remove it entirely if only `full_name` matters.

If kept, rename it:

```text
Готовность профиля
Имя заполнено
```

Incomplete state:

```text
Добавьте имя, чтобы гиды понимали, к кому обращаются.
```

Do not say “в форме ниже” unless the status is actually above the form.

Avatar status should read as a normal alert/status:

```text
Фото профиля обновлено
```

Avoid making it look like another input.

For the cursor issue:

- Verify whether there is truly a duplicate focus indicator.
- If it is just the focused input caret, no functional fix is needed.
- If the visual looks broken, adjust only token-based Tailwind/shadcn classes on the input/focus ring, not custom CSS.

## 5. Implementation Checklist

1. Update `/account` traveler header in `src/app/(protected)/account/page.tsx`:
   - H1: `Профиль путешественника`
   - Optional subtitle: `Эти данные видят гиды, когда отвечают на ваши запросы.`
   - Remove or simplify eyebrow.

2. Remove the redundant bottom `TravelerProfileCompletionChecklist`, or move a renamed compact “Готовность профиля” status above the form.

3. If keeping completion logic, update:
   - `TRAVELER_PROFILE_SECTION_2_TITLE`
   - checklist labels/copy
   - tests in `traveler-profile-completion.test.ts`
   - component test coverage for complete/incomplete states.

4. Improve avatar success copy in `AvatarUploadBlock` if action returns “Аватар обновлён”; prefer “Фото профиля обновлено”.

5. Add/update tests:
   - `/account` traveler render has one main H1: “Профиль путешественника”.
   - No visible duplicate “Профиль путешественника” section below Save unless it is deliberately a renamed readiness block.
   - Incomplete checklist/status does not reference “ниже” when placed below/above incorrectly.
   - Existing form fields still render.

6. Browser checks:
   - `/account` desktop at screenshot-like width.
   - `/account` mobile.
   - Focus each input and confirm no duplicate caret/focus artifact.
   - Upload avatar success/error state.
   - Save form with valid traveler profile.
   - Empty name validation.

7. Required project verification:
   - `bun run typecheck`
   - `bun run lint`

Acceptance criteria:

- The page has one clear identity: “Профиль путешественника”.
- No repeated profile/cabinet headings stacked on the same viewport.
- Completion/status copy points to the correct place and does not create a second “profile” section.
- No visual second cursor/input artifact in focused or unfocused states.

## 6. Risk Notes

Do not change Supabase schema for this fix. The visible issue is copy/layout/component composition, not data modeling.

Do not alter RLS or broad profile policies. Saving uses `profiles.update(...).eq("id", user.id)` and should remain user-scoped.

Do not modify `src/components/ui` primitives casually. Fix this at the page/component layer with Tailwind/shadcn usage.

Do not merge traveler `/account` with guide profile behavior. The guide branch in the same page serves different settings and should not inherit traveler copy.

Be careful removing the checklist if other flows depend on `isTravelerProfileSection2Complete`. If it is used elsewhere as a completion gate, keep the logic and only change this page’s presentation.