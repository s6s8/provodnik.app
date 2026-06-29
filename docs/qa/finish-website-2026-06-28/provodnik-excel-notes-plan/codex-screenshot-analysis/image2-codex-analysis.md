## 1. Screenshot Identity

Route/area: `/auth`, auth form bottom area.

Visible UI: primary blue rounded CTA button labeled `Войти`, followed by secondary text action `Нет аккаунта? Создать профиль`.

Screenshot-specific complaint: the auth form/layout looks crooked/awkward. The Excel note also attaches the phone uniqueness concern to this auth area.

Evidence scope: this crop is only `313 x 114`, so it does not prove the whole page geometry by itself. It does show the final CTA and account-mode toggle are visually unbalanced.

## 2. UX/Product Diagnosis

The visible hierarchy is too abrupt. `Войти` is a strong full-width pill, then the signup toggle appears as low-contrast loose text below it. Because the toggle is not centered or grouped with the button, the form ending looks accidental rather than designed.

The toggle copy is functional but weak as an affordance. `Нет аккаунта? Создать профиль` is a button in code, but visually reads like grey helper text. Users can miss that it changes the form mode. This is especially risky because account creation is a primary path for first-time travelers.

Spacing feels awkward: the screenshot shows a large white/glass empty region between the CTA and the toggle, then the toggle floats near the left edge. The eye expects either a centered footer line under the CTA or a clear segmented sign-in/sign-up switch above the form.

The CTA shape is very rounded, while the surrounding form uses `rounded-glass` and `rounded-[1.2rem]` inputs. This is not fatal, but in the crop the pill dominates and makes the lower form look like a detached mobile button pasted into a desktop card.

State clarity is incomplete. The user sees `Войти`, but there is no local context in this crop saying “Вход” or “Войти в профиль”. If the top of the form is above the crop, the bottom still needs to close the flow cleanly.

Trust issue: the phone note belongs to signup mode, not the visible login mode. Current signup labels phone as optional, but source stores it directly and the schema does not enforce uniqueness. If product expects phone to identify a person/account, the UI currently overpromises by collecting it without explaining whether it is contact info, identity, or recovery data.

## 3. Source/Code Investigation

Primary component:

- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:228) defines `ctaLabel` and `toggleLabel`.
- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:393) renders the full-width submit `Button`.
- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:402) renders the mode toggle as a plain `<button>` with `mt-6 inline-flex w-fit text-sm text-muted-foreground`.
- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:279) form spacing is `mt-8 space-y-5`.
- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:235) card width/padding uses `w-[min(100%,30rem)]`, `rounded-glass`, `bg-glass`, `p-[clamp(...)]`.

Page shell:

- [page.tsx](/Users/idev/provodnik/src/app/(auth)/auth/page.tsx:67) wraps the auth page in a centered two-column grid.
- [page.tsx](/Users/idev/provodnik/src/app/(auth)/auth/page.tsx:92) centers `AuthEntryScreen` in the right column.

Phone/signup path:

- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:299) signup phone field is labeled `Телефон (необязательно)`.
- [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:205) sends `phone.trim() || undefined` to `signUpAction`.
- [signUpAction.ts](/Users/idev/provodnik/src/features/auth/actions/signUpAction.ts:78) writes phone to `profiles` via admin upsert.
- [20260401000001_schema.sql](/Users/idev/provodnik/supabase/migrations/20260401000001_schema.sql:48) `profiles.phone` is plain nullable `text`, with no unique/index/normalization shown.
- [database.types.ts](/Users/idev/provodnik/src/lib/supabase/database.types.ts:2368) generated type confirms `phone: string | null`.

Tests to inspect/update:

- [auth-entry-screen.test.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.test.tsx:1) covers auth form behavior and redirects.
- [sign-up.test.ts](/Users/idev/provodnik/src/features/auth/tests/sign-up.test.ts:59) covers server signup action.
- `tests/e2e/request-first-smoke.spec.ts` includes a basic `/auth` smoke path.

## 4. Redesign/Fix Strategy

Keep the current Provodnik system: glass card, shadcn `Button`, Tailwind utilities, no custom CSS classes.

Recommended layout change for the screenshot area:

Before:

```tsx
<Button className="h-12 w-full rounded-full">Войти</Button>

<button className="mt-6 inline-flex w-fit text-sm text-muted-foreground">
  Нет аккаунта? Создать профиль
</button>
```

After:

```tsx
<Button className="h-12 w-full rounded-full">
  Войти
</Button>

<div className="mt-5 flex justify-center text-sm">
  <span className="text-muted-foreground">Нет аккаунта?</span>
  <button
    type="button"
    className="ml-1 font-medium text-primary transition-colors duration-200 hover:text-primary/80"
  >
    Создать профиль
  </button>
</div>
```

Russian copy suggestions:

- Login CTA: keep `Войти`, or make clearer: `Войти в профиль`.
- Signup toggle: `Нет аккаунта? Создать профиль`.
- Signup CTA: keep `Создать профиль`.
- Signin toggle from signup mode: `Уже есть аккаунт? Войти`.

Behavior should stay identical: the toggle only switches local mode via `handleModeChange`, without navigation and without losing entered fields unless product wants reset.

For a stronger auth design, add a clear form heading above inputs, not visible in this screenshot but important for orientation:

- Sign-in heading: `Вход в профиль`
- Sign-up heading: `Создание профиля`
- Supporting line for signup: `Заполните данные, чтобы отправлять заявки и получать предложения гидов.`

Phone strategy:

- If phone remains optional contact info, update helper copy near the field: `Нужен только для связи по заявке. Можно добавить позже.`
- If phone must be unique, do not solve it only in UI. Add normalized phone handling and a DB constraint/migration after checking existing duplicates.
- Avoid claiming “один телефон = один аккаунт” until backend enforces it.

## 5. Implementation Checklist

1. Update the CTA footer layout in [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:393): center the account toggle and separate muted prompt text from the clickable action.

2. Consider changing `ctaLabel` for sign-in from `Войти` to `Войти в профиль` if visual QA still finds the form ambiguous.

3. Add form heading/subheading above the form if the current card has no visible mode title in full-page screenshots.

4. Add signup phone helper text only if keeping phone collection:
   `Нужен только для связи по заявке. Можно добавить позже.`

5. Add/update component tests in [auth-entry-screen.test.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.test.tsx:1):
   - default traveler mode shows sign-in CTA and centered signup toggle text;
   - clicking `Создать профиль` switches to signup fields;
   - signup mode shows phone as optional and still passes phone to `signUpAction`.

6. If product requires phone uniqueness, create a separate backend task:
   - define phone normalization format;
   - audit existing duplicate/null phones;
   - add normalized column or expression index;
   - map duplicate violation to friendly Russian copy;
   - update [sign-up.test.ts](/Users/idev/provodnik/src/features/auth/tests/sign-up.test.ts:59).

7. Browser checks:
   - `/auth` desktop: CTA and toggle align visually; no “floating grey text” below the button.
   - `/auth` mobile: no horizontal overflow, button text fits, toggle remains tappable.
   - `/auth?role=guide`: signup mode remains clear with extra fields.
   - Disabled env state still disables submit and keeps layout stable.

8. Required verification after implementation:
   - `bun run typecheck`
   - `bun run lint`

Acceptance criteria:

- The lower auth form no longer looks left-drifting or accidental.
- The secondary action is clearly clickable but not competing with the primary CTA.
- No custom CSS classes or inline layout styles are added.
- Phone behavior is either accurately explained as optional contact info or enforced through a deliberate backend change.

## 6. Risk Notes

Do not change auth redirects, role resolution, session handling, or RLS while fixing this visual issue. Those paths are active in [auth-entry-screen.tsx](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:129) and are higher-risk than the footer layout.

Do not casually add a unique constraint to `profiles.phone`. Phones need normalization, duplicate audit, migration planning, and product confirmation. Family/shared phones, guides with office numbers, and copied formatting variants can all create false positives.

Do not modify `src/components/ui/button.tsx` for this screenshot. The problem is usage/layout in the auth form, not the shared primitive.

Do not redesign the page into a new auth brand. Keep the existing glass card, brand blue primary button, Tailwind tokens, and shadcn conventions.