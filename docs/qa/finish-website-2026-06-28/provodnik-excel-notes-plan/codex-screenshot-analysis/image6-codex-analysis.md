## 1. Screenshot Identity

Page/route: `/guide/profile`, section `#legal` / “Юридические данные”.

Visible UI: a large white card with title, helper text, legal status select, INN input, document country select, “Туроператор” checkbox, and primary “Сохранить” button.

Screenshot-specific complaint: the save button/layout feels cramped and visually collides with the checkbox area. In the screenshot the button is placed directly under the “Туроператор” row with weak separation, while the card itself has huge unused horizontal space.

## 2. UX/Product Diagnosis

The main issue is not only “overlap”; it is poor form structure.

The form reads as a loose vertical dump of fields. The INN input stretches almost the entire card width, but the selects and checkbox are tiny. This creates an unbalanced page: users scan a massive legal block but only a few compact controls are actually actionable.

The “Сохранить” button is too close to the checkbox row. It appears as if it belongs to the checkbox rather than to the entire form. There is no footer zone, no divider, no save/status grouping, and no explanation that legal data may become locked after verification.

Copy is too thin for a trust-sensitive legal step. “ИНН, статус, страна документа.” says what fields exist, but not why Provodnik asks for them or what happens after approval. For guides, legal data is sensitive; the UI should explain that it is used for accreditation/verification and may be edited only before approval.

The “Туроператор” checkbox is ambiguous. It can mean “I am booking a tour operator”, “I represent one”, or “show me tour operators”. It needs an explicit sentence: “Я зарегистрирован как туроператор” or “Я работаю от имени туроператора”.

State clarity is incomplete. The source has locked-state copy, success alert, and error alert, but the default form gives no persistent expectation about locking, registry number requirements, or required fields.

## 3. Source/Code Investigation

Likely files to change:

- [src/app/(protected)/guide/profile/page.tsx](/Users/idev/provodnik/src/app/(protected)/guide/profile/page.tsx:329) renders the legal card.
  - Lines 329-340 mount the `LegalInformationForm`.
  - Lines 333-336 contain current title/helper copy: “ИНН, статус, страна документа.”
  - Lines 120-126 and 229-235 prepare `legalInitialData`.
  - Lines 242-246 define `legalDone` from `legalStatus`, `inn`, and `documentCountry`.

- [src/features/profile/components/LegalInformationForm.tsx](/Users/idev/provodnik/src/features/profile/components/LegalInformationForm.tsx:75) owns the visible screenshot UI.
  - Line 76: `<form className="space-y-6">`.
  - Line 82: fieldset uses `space-y-4`, which makes the checkbox and footer feel cramped.
  - Lines 84-127: legal status, INN, document country.
  - Lines 129-143: separator + raw checkbox.
  - Lines 146-159: conditional registry number field.
  - Lines 162-176: success/error alerts and save button are just appended after the fieldset, with no footer grouping.

- [src/features/profile/actions/updateLegalInformation.ts](/Users/idev/provodnik/src/features/profile/actions/updateLegalInformation.ts:7) handles persistence.
  - Zod currently accepts nullable strings without INN/country shape validation.
  - Lines 33-40 block edits for approved guide profiles.
  - Lines 42-51 update `guide_profiles`.

- [src/features/profile/actions/updateLegalInformation.test.ts](/Users/idev/provodnik/src/features/profile/actions/updateLegalInformation.test.ts:45) covers locked/update behavior, but not stricter validation or tour-operator registry behavior.

Related consistency reference:

- [src/features/guide/components/profile/guide-about-form.tsx](/Users/idev/provodnik/src/features/guide/components/profile/guide-about-form.tsx:63) uses `max-w-xl`, so the “О себе” form is constrained while the legal form is full-width. Legal should follow the same density pattern.

Database/schema references:

- `guide_profiles.legal_status`, `inn`, `document_country`, `is_tour_operator`, `tour_operator_registry_number` were added in `supabase/migrations/20260413000001_tripster_v1.sql`.
- Generated types include `legal_status` in [src/lib/supabase/database.types.ts](/Users/idev/provodnik/src/lib/supabase/database.types.ts:917).

## 4. Redesign/Fix Strategy

Before:

- Huge card, full-width INN input.
- Tiny select controls mixed with a massive input.
- “Туроператор” checkbox followed immediately by “Сохранить”.
- Helper copy only lists fields.

After:

- Keep the existing card and brand tokens.
- Constrain the form content: `max-w-xl` or `max-w-2xl`.
- Use a clearer field rhythm:
  - legal status
  - INN
  - document country
  - tour-operator block
  - footer with save/status
- Put the save button in a dedicated footer row with top border/padding.
- Make the tour-operator checkbox a clear, tappable row with helper text.
- Keep Tailwind utilities/shadcn only. No custom CSS classes, no inline layout styles.

Suggested card copy:

```text
Юридические данные
Нужны для проверки статуса гида и допуска к заявкам. После одобрения профиля изменить эти данные можно через администратора.
```

Suggested field labels/copy:

```text
Правовой статус
Самозанятый / ИП / Юридическое лицо / Не указано

ИНН
Введите ИНН

Страна документа
Выберите страну

Я зарегистрирован как туроператор
Отметьте, если у вас есть запись в реестре туроператоров.

Номер в реестре туроператоров
Например: РТО 000000
```

Suggested layout behavior:

- Form root: `className="max-w-xl space-y-6"`.
- Fieldset: `className="space-y-5 border-0 p-0 m-0"`.
- Remove or soften the standalone separator before the checkbox unless it starts a titled subsection.
- Tour operator block:
  - wrapper `rounded-lg border border-border bg-background px-4 py-3`
  - label row `flex items-start gap-3`
  - helper `text-xs text-muted-foreground`
- Footer:
  - `div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center"`
  - button first, saved/error state next to it on desktop, below on mobile.
- Use `loading={isPending}` on `Button` if consistent with the local button API, instead of only changing text.

## 5. Implementation Checklist

1. Update `/guide/profile` legal card helper copy in `page.tsx`.
2. Refactor `LegalInformationForm.tsx` layout:
   - add `max-w-xl` or `max-w-2xl`
   - increase field spacing from `space-y-4` to `space-y-5`/`space-y-6`
   - create a real submit footer with border and padding
   - rewrite tour-operator checkbox label/helper
   - keep all styling as Tailwind utilities/shadcn tokens.
3. Preserve locked behavior:
   - locked warning still appears
   - fields disabled when approved
   - save button hidden when locked.
4. Consider validation follow-up:
   - INN length/format by legal status if product requires it
   - require registry number only when `isTourOperator === true`
   - do not add DB constraints casually unless admin/import flows are audited.
5. Tests:
   - component test for `LegalInformationForm` rendering footer separation and conditional registry field
   - existing `updateLegalInformation.test.ts` still passes
   - add action tests only if validation behavior changes.
6. Browser checks:
   - `/guide/profile` desktop around 1680px wide: legal form should no longer span the entire card
   - tablet/mobile: button must not touch/overlap checkbox text
   - checked tour-operator state: registry field appears with enough spacing
   - locked approved state: warning readable, no save button.
7. Required verification:
   - `bun run typecheck`
   - `bun run lint`

Acceptance criteria:

- The save button is visually separated from the checkbox and clearly belongs to the whole legal form.
- The legal card no longer has a single oversized INN input across the full viewport.
- Russian copy explains why data is requested and when it locks.
- No custom CSS classes, no inline layout styles, no changes to shadcn primitives unless absolutely necessary.

## 6. Risk Notes

Do not change RLS for this visual fix. `guide_profiles` remains the security boundary.

Do not remove the approved-profile lock. The action intentionally blocks legal edits after approval.

Be careful with stricter validation. Existing demo/user rows may contain incomplete legal data, and `legalDone` currently only checks presence of status, INN, and document country. Registry-number requirements could affect onboarding completion if added without migration/data review.

Do not redesign the whole guide profile page from this screenshot. The clean fix is a constrained, better-structured legal form and clearer copy within the existing Provodnik card system.