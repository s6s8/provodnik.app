# Codex Screenshot-by-Screenshot Analysis


---

# image1

**1. Screenshot Identity**

Route/page: `/auth`, desktop left trust panel.

Visible UI: dark navy/brand gradient panel with `Provodnik` wordmark, headline “Найдите проверенного местного гида”, supporting text, and four checkmark trust points:

- “Бесплатно для путешественников”
- “Гиды проходят проверку”
- “Честную цену предлагают сами гиды”
- “Поддержка на каждом шаге”

Screenshot-specific complaint: the trust copy is confusing. “Бесплатно для путешественников” does not say what is free, “Честную цену” invites comparison questions, and “Поддержка на каждом шаге” is too vague.

**2. UX/Product Diagnosis**

The panel is trying to build trust at the exact moment a user decides whether to sign in or create an account, but the claims are abstract.

“Бесплатно для путешественников” is under-specified. A traveler can reasonably ask: free registration, free requests, free booking, no service fee, or free excursions? If money is involved later, this can feel misleading.

“Честную цену предлагают сами гиды” is weak and slightly defensive. “Честная” is subjective; it implies there is a benchmark, but the UI does not explain compared with what. The useful product promise is not “honest price”; it is that the traveler sees guide-proposed terms before choosing.

“Поддержка на каждом шаге” has no operational meaning. It does not say whether support helps with account access, finding a guide, disputes, payment, cancellations, or document verification. Vague support copy lowers trust because it sounds like generic SaaS filler.

The hierarchy is also off in the screenshot: the headline appears very low contrast against the dark panel, almost black on navy. Source intends `text-white`, so this needs browser verification, but the screenshot should be treated as evidence of a contrast regression or capture-specific CSS issue until disproven.

The checkmark list has equal visual weight for all claims. “Гиды проходят проверку” is the strongest trust point and should be more concrete, especially given the broader product direction that Provodnik works with accredited guides.

**3. Source/Code Investigation**

Primary source:

- [`src/app/(auth)/auth/page.tsx`](/Users/idev/provodnik/src/app/(auth)/auth/page.tsx:59): defines `trustPoints`, headline, supporting copy, left panel layout, and checkmark list.
- [`src/features/auth/components/auth-entry-screen.tsx`](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.tsx:234): renders the auth form card beside this panel.
- [`src/features/auth/actions/signUpAction.ts`](/Users/idev/provodnik/src/features/auth/actions/signUpAction.ts:41): creates auth user/profile and stores optional phone.
- [`src/features/auth/components/auth-entry-screen.test.tsx`](/Users/idev/provodnik/src/features/auth/components/auth-entry-screen.test.tsx:1): current unit tests for auth form behavior.
- [`tests/e2e/request-first-smoke.spec.ts`](/Users/idev/provodnik/tests/e2e/request-first-smoke.spec.ts:3): existing Playwright smoke check for `/auth`.

Schema/auth context:

- [`supabase/migrations/20260401000001_schema.sql`](/Users/idev/provodnik/supabase/migrations/20260401000001_schema.sql:48): `profiles` table includes `phone text`; no visible unique constraint on phone.
- [`src/lib/supabase/database.types.ts`](/Users/idev/provodnik/src/lib/supabase/database.types.ts:2361): generated `profiles` type includes nullable `phone`.

**4. Redesign/Fix Strategy**

Keep the current brand panel: navy/brand gradient, glass system, check icons, restrained auth layout. Do not introduce a new illustration, marketing hero, or custom CSS.

Recommended copy change:

Before:

```tsx
const trustPoints = [
  "Бесплатно для путешественников",
  "Гиды проходят проверку",
  "Честную цену предлагают сами гиды",
  "Поддержка на каждом шаге",
];
```

After, ideally as title + description objects:

```tsx
const trustPoints = [
  {
    title: "Регистрация и заявка бесплатны",
    description: "Создайте профиль и отправьте запрос без оплаты.",
  },
  {
    title: "Только проверенные гиды",
    description: "Проверяем профиль и документы перед работой на платформе.",
  },
  {
    title: "Условия видны заранее",
    description: "Гид предлагает цену и формат поездки до вашего решения.",
  },
  {
    title: "Помощь по заявке и бронированию",
    description: "Подскажем, если возник вопрос по входу, откликам или поездке.",
  },
];
```

If the design must stay single-line, use tighter copy:

- “Регистрация и заявка бесплатны”
- “Проверяем профиль и документы гида”
- “Цена и условия видны до выбора”
- “Поможем с заявкой и бронированием”

Headline/supporting copy can stay close to current, but make the trust model sharper:

Before:

```text
Найдите проверенного местного гида
Создайте профиль за минуту и планируйте поездку вместе с гидами, которым доверяют.
```

After:

```text
Найдите проверенного гида для поездки
Создайте профиль, отправьте запрос и сравните предложения гидов до бронирования.
```

Visual fixes:

- Verify computed color for the H1 in `/auth`; it must render as `text-white` or `text-white/95`, not dark text on navy.
- Keep `aside` background tokens/gradient, but consider replacing `text-white/70` paragraph with `text-white/80` for readability.
- If using title + description trust points, use `text-sm font-medium text-white` for title and `text-xs leading-5 text-white/65` for description.
- Keep the list at 4 items maximum; this is an auth page, not a product explainer.
- Do not add custom CSS classes or `<style>` blocks; use Tailwind utilities only.

**5. Implementation Checklist**

1. Update trust panel copy in [`src/app/(auth)/auth/page.tsx`](/Users/idev/provodnik/src/app/(auth)/auth/page.tsx:59).
2. If using richer trust point objects, update the `map` render to output title and optional description with stable spacing.
3. Check H1 contrast in browser at desktop width; confirm no dark headline text on the navy panel.
4. Check `/auth` desktop and mobile:
   - desktop: left panel and auth card align cleanly, no awkward vertical imbalance;
   - mobile: left panel remains hidden as currently intended, auth form still works.
5. Add or update a lightweight test asserting the new trust copy appears on `/auth`. Best place: Playwright smoke in [`tests/e2e/request-first-smoke.spec.ts`](/Users/idev/provodnik/tests/e2e/request-first-smoke.spec.ts:3), or a page-level render test if project patterns support async server components.
6. Run required gate:
   - `bun run typecheck`
   - `bun run lint`
7. Acceptance criteria:
   - no “Бесплатно для путешественников” copy remains on `/auth`;
   - no “Честную цену” copy remains on `/auth`;
   - support claim says what support covers;
   - visual contrast passes obvious manual inspection;
   - no custom CSS classes, no inline layout styles.

**6. Risk Notes**

Do not change auth redirects, role resolution, Supabase client behavior, or RLS as part of this copy/layout fix. The trust panel is in the server page wrapper; auth mechanics live separately in `AuthEntryScreen` and `signUpAction`.

Be careful with “бесплатно”: only claim what is definitely true. “Регистрация и заявка бесплатны” is safer than implying trips, guide services, or the whole platform are free.

Do not promise “аккредитованные гиды” unless the product/data model actually enforces accreditation before guide marketplace participation. If enforcement is not complete, use “проверяем профиль и документы” until the guide verification flow is aligned.

The phone reuse concern belongs to the signup flow, not this visible panel. If addressed later, it may require product policy plus schema/action changes; do not casually add a phone unique constraint without normalization, backfill checks, duplicate handling, and a clear reason why shared family/business phones are disallowed.

---

# image2

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

---

# image3

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

---

# image4

## 1. Screenshot Identity — Page/Route, Visible UI, Complaint

Route/area: `/become-a-guide`, hero section.

Visible UI: full-width mountain/green landscape hero with large white H1 `Станьте гидом Проводника`, subtitle `Зарабатывайте на авторских экскурсиях — вы выбираете запросы, цену и ритм.`, primary CTA `Стать гидом`.

Screenshot-specific complaint: the claim `Зарабатывайте на авторских экскурсиях` should be removed, and the page needs explicit accreditation positioning: `Проводник работает только с аккредитированными гидами`.

Important source finding: current source at [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:51) still contains the complained-about subtitle, but current shared `InfoHero` at [src/components/shared/info-shell.tsx](/Users/idev/provodnik/src/components/shared/info-shell.tsx:41) is now a compact text hero, not the screenshot’s image hero. Treat the screenshot as valid user evidence of the copy/problem, but verify the live UI before implementing visual changes.

## 2. UX/Product Diagnosis

The subtitle is the main problem. `Зарабатывайте на авторских экскурсиях` frames the product as easy monetization, while the desired marketplace trust model is selective, verified, and accreditation-led. For a guide-facing acquisition page, that creates the wrong expectation: “anyone can sign up and earn” instead of “qualified guides can apply and work through a trusted channel.”

The hierarchy is also off for the accreditation requirement. The H1 says “become a guide,” the CTA repeats “become a guide,” and the only supporting line talks about income, request choice, price, and rhythm. There is no visible qualification gate in the hero, so a non-accredited person can reasonably assume they are eligible.

Trust clarity is weak. The screenshot has a nice confident visual tone, but the message does not explain who this is for, what happens after signup, or why travelers should trust the guides. The needed trust statement appears later in source as generic manual review text, but the screenshot complaint requires it in the first viewport.

Affordance is acceptable: the CTA is clear and visually strong. The problem is not button discoverability; it is pre-click expectation setting.

Spacing in the screenshot is serviceable, but the hero feels like a marketing banner rather than an application entry point. If the current compact `InfoHero` is live, that is already closer to the project’s info-page system and should be preserved unless product explicitly wants image heroes back.

## 3. Source/Code Investigation

Primary file to change:

- [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:13)
  - `STEPS` at lines 13-17.
  - `BENEFITS` at lines 19-38.
  - `TRUST` at lines 40-44.
  - `InfoHero` copy at lines 49-56.
  - Current bad subtitle at line 52.
  - Trust block title at lines 88-91.

Shared layout/components to inspect but probably not modify:

- [src/components/shared/info-shell.tsx](/Users/idev/provodnik/src/components/shared/info-shell.tsx:18)
  - `InfoPageShell` controls page width and rhythm.
  - `InfoHero` controls hero typography and spacing.
  - Comment explicitly says these info pages use a compact text hero, no decorative full-bleed photo.
- [src/app/(site)/layout.tsx](/Users/idev/provodnik/src/app/(site)/layout.tsx:6)
  - Public layout wraps route with header/footer and `pt-nav-h`.
- [src/lib/navigation.ts](/Users/idev/provodnik/src/lib/navigation.ts:28)
  - Public nav label for `/become-a-guide` is already `Стать гидом`; no change needed.

Related implementation risks/files:

- Auth destination: CTA currently links to `/auth?role=guide` at [page.tsx:55](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:55). Check `/auth` behavior only if changing application flow.
- Guide verification/profile logic is elsewhere and should not be changed for this copy fix unless product explicitly scopes it:
  - `src/features/guide/verification-actions.ts`
  - `src/features/guide/actions/completeOnboarding.ts`
  - `src/app/(protected)/guide/profile/page.tsx`
  - `src/app/(protected)/admin/guides/*`

## 4. Redesign/Fix Strategy

Keep the current Provodnik design system: `InfoPageShell`, `InfoHero`, `InfoSection`, shadcn `Button`, Tailwind tokens. Do not reintroduce a bespoke image hero just because the screenshot shows one.

Hero before:

```text
Станьте гидом Проводника
Зарабатывайте на авторских экскурсиях — вы выбираете запросы, цену и ритм.
[Стать гидом]
```

Hero after, recommended:

```text
Станьте гидом Проводника
Проводник работает только с аккредитированными гидами. После проверки профиля вы сможете отвечать на подходящие запросы путешественников и предлагать свои условия.
[Подать заявку]
```

CTA should be changed from `Стать гидом` to `Подать заявку` on this page. It sets the correct state: this is an application and verification flow, not immediate activation. The nav can remain `Стать гидом`.

Steps before/after:

- Before: `Заполните анкету и загрузите документы.`
- After: `Заполните анкету и загрузите подтверждение аккредитации.`
- Before: `Проверка профиля за 24–48 часов — после одобрения открываем доступ к запросам.`
- After: `Мы проверим профиль и документы. После одобрения откроем доступ к запросам путешественников.`
- Before: `Отвечайте на запросы и выбирайте подходящие по дате и цене.`
- After: `Выбирайте подходящие запросы и предлагайте формат, дату и цену.`

Benefits should stop over-indexing on income. Suggested replacement:

```text
Проверенный профиль
Путешественники видят, что гид прошёл проверку Проводника.

Подходящие запросы
Вы отвечаете только на поездки, которые подходят по региону, дате и формату.

Условия фиксируются
Цена, состав группы и детали встречи остаются в переписке и заявке.
```

Trust block title before:

```text
Гиды Проводника — реальные специалисты
```

Trust block after:

```text
Кто может работать в Проводнике
```

Trust items after:

```text
Только гиды с действующей аккредитацией или подтверждающими документами.
Профиль и документы проверяются вручную перед доступом к запросам.
Если статус изменится, доступ к заявкам нужно будет подтвердить заново.
```

Avoid promising income level, guaranteed demand, instant access, or automatic approval.

## 5. Implementation Checklist

1. Update [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:52):
   - Replace hero subtitle.
   - Change page CTA text from `Стать гидом` to `Подать заявку`.
   - Keep `href="/auth?role=guide"` unless auth flow has a separate guide application route.

2. Update `STEPS` in the same file:
   - Mention accreditation document.
   - Remove the hard `24–48 часов` promise unless operations confirm it is real.
   - Clarify approval gates access to requests.

3. Update `BENEFITS`:
   - Remove income-first framing.
   - Replace with verified profile, suitable requests, and fixed written conditions.

4. Update `TRUST` block:
   - Add explicit accreditation requirement.
   - Rename the block to `Кто может работать в Проводнике`.

5. Do not modify `InfoHero` globally unless browser review shows `/how-it-works`, `/trust`, or `/help` need the same visual change. This shared component affects multiple pages.

6. Browser checks:
   - `/become-a-guide` desktop around 1280px.
   - Mobile around 375px.
   - Verify no text overflow in hero, cards, CTA.
   - Verify first viewport clearly communicates accreditation requirement.
   - Verify CTA still routes to guide auth/application flow.

7. Verification:
   - `bun run typecheck`
   - `bun run lint`
   - Optional focused test only if a route/page test exists or is added for static copy.

Acceptance criteria:

- The exact phrase `Зарабатывайте на авторских экскурсиях` no longer appears on `/become-a-guide`.
- First viewport includes `Проводник работает только с аккредитированными гидами` or equivalent direct wording.
- CTA reads like an application action, preferably `Подать заявку`.
- No custom CSS classes, no inline layout styles, no global CSS changes.

## 6. Risk Notes

Do not change schema, RLS, guide approval logic, or admin moderation as part of this screenshot fix. The complaint is copy/positioning; enforcement belongs to separate verification/admin flows.

Be careful with the word `аккредитированными`: if the product legally requires a specific credential type, the implementation should match that term exactly. If not, use a safer phrase like `с аккредитацией или подтверждающими документами`.

Do not promise review time unless operations can meet it. The current `24–48 часов` may become a support liability.

Do not rework the site’s visual identity. The current source intentionally uses shared info-page primitives; changing `InfoHero` to a photo hero would affect the system direction and should be a separate design decision.

There is a screenshot/source mismatch: screenshot shows an image hero, current source shows text-led `InfoHero`. Executor should run the app and confirm the actual current visual state before making layout changes. Copy changes are still required because the bad subtitle exists in source.

---

# image5

**1. Screenshot Identity**

Route/area: `/become-a-guide`, benefits section.

Visible UI: one benefit card with a blue upward-trend icon, title “Большая часть дохода — вам”, and body text “Вы оставляете себе большую часть выручки. Никаких скрытых сборов и платных подписок.”

Screenshot-specific complaint: this income/benefit block is unrealistic and should be removed or replaced with a truthful accreditation/verification flow. This matches the broader note that `/become-a-guide` should say “Проводник работает только с аккредитированными гидами” instead of selling vague earning upside.

**2. UX/Product Diagnosis**

The card makes a financial claim without proof. “Большая часть дохода — вам” and “большую часть выручки” imply an established commission/tariff model, but the page does not show exact commission, payout timing, payment model, taxes, or legal terms. For a guide, this creates immediate skepticism: “How much exactly?”, “Who collects payment?”, “When do I receive money?”, “What is the platform fee?”

The phrase “Никаких скрытых сборов и платных подписок” is defensive. It answers a possible objection, but without naming the actual pricing model it can sound like marketplace boilerplate. If the product cannot state the fee model precisely, this copy should not lead the benefits section.

The visible hierarchy is also misleading. The first benefit card emphasizes income, while the actual product gate is verification/accreditation. In source, the real flow requires profile, legal data, documents, and qualification proof before a guide can be reviewed. The benefit section should orient around trust and admission criteria, not revenue optimism.

The card layout itself is visually clean and on-brand, but too generic. The trend icon reinforces a “growth/earn more” promise, which conflicts with the requested product truth: Provodnik should be positioned as a controlled network of qualified guides, not an open gig-income platform.

**3. Source/Code Investigation**

Primary page source:

- [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:13): `STEPS` already describe application, document upload, and review.
- [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:19): `BENEFITS` defines the screenshot card. First item uses `TrendingUp` and the problematic income copy.
- [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:40): `TRUST` has more truthful verification language but is lower on the page.
- [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:49): hero subtitle still says “Зарабатывайте на авторских экскурсиях”, also flagged for removal.

Shared layout:

- [src/components/shared/info-shell.tsx](/Users/idev/provodnik/src/components/shared/info-shell.tsx:18): `InfoPageShell`, `InfoHero`, `InfoSection`; preserve this system rather than creating a new visual language.

Real verification flow:

- [src/features/guide/components/verification/verification-upload-form.tsx](/Users/idev/provodnik/src/features/guide/components/verification/verification-upload-form.tsx:44): required document slots are passport and selfie; certificate/attestation is shown but optional in that upload widget.
- [src/features/guide/verification-actions.ts](/Users/idev/provodnik/src/features/guide/verification-actions.ts:266): server submission checks guide profile, bio, legal data, and document state.
- [src/features/guide/verification-actions.ts](/Users/idev/provodnik/src/features/guide/verification-actions.ts:288): at least one `guide_licenses` row is required before submission, with error “Добавьте хотя бы один документ о квалификации перед отправкой.”
- [src/app/(protected)/admin/guides/page.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.tsx:105): admin queue reviews guides with `submitted` status.

Tests to inspect/add:

- No current `src/app/(site)/become-a-guide/page.test.tsx` was found.
- Existing relevant tests: `src/features/guide/verification-actions.test.ts`, `src/features/guide/components/verification/verification-upload-form.test.tsx`, `src/app/(protected)/admin/guides/page.test.tsx`.

**4. Redesign/Fix Strategy**

Keep the existing compact info-page structure, cards, Tailwind tokens, shadcn `Button`, and lucide icons. Replace the benefits narrative with a verification/accreditation narrative.

Hero before:

```text
Станьте гидом Проводника
Зарабатывайте на авторских экскурсиях — вы выбираете запросы, цену и ритм.
```

Hero after:

```text
Станьте гидом Проводника
Проводник работает с гидами, которые подтверждают опыт, документы и готовность вести поездки прозрачно.
```

If product/legal wants the stronger wording from the Excel note:

```text
Проводник работает только с аккредитированными гидами. Подайте анкету, загрузите документы и дождитесь ручной проверки.
```

But only use “аккредитированными” if the product team is comfortable treating `guide_licenses` + admin approval as accreditation. Otherwise use “подтверждёнными” or “проверенными”.

Benefits before:

```text
Большая часть дохода — вам
Вы оставляете себе большую часть выручки. Никаких скрытых сборов и платных подписок.
```

Benefits after, recommended three cards:

```tsx
const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Только после проверки",
    description:
      "Мы проверяем анкету, документы и квалификацию перед доступом к запросам путешественников.",
  },
  {
    icon: FileCheck2,
    title: "Понятный статус заявки",
    description:
      "После отправки анкета попадает на ручную проверку. Обычно это занимает 1–2 рабочих дня.",
  },
  {
    icon: MessageCircle,
    title: "Запросы с понятными условиями",
    description:
      "После одобрения вы отвечаете на подходящие запросы и фиксируете условия письменно.",
  },
] as const;
```

Steps should be tightened to match actual flow:

Before:

```text
Заполните анкету и загрузите документы.
Проверка профиля за 24–48 часов — после одобрения открываем доступ к запросам.
Отвечайте на запросы и выбирайте подходящие по дате и цене.
```

After:

```text
Заполните профиль, юридические данные и добавьте документ о квалификации.
Загрузите паспорт и селфи с документом, затем отправьте анкету на проверку.
После одобрения профиль и объявления становятся видны путешественникам.
```

The existing `TRUST` block can be merged with or placed above benefits. Avoid duplicating the same verification message in both `STEPS`, `BENEFITS`, and `TRUST`; the page should read as one coherent admission flow.

**5. Implementation Checklist**

1. In [src/app/(site)/become-a-guide/page.tsx](/Users/idev/provodnik/src/app/(site)/become-a-guide/page.tsx:3), replace `TrendingUp`/`Users` income-style icons with verification-appropriate lucide icons such as `ShieldCheck`, `FileCheck2`, `MessageCircle`.
2. Remove “Зарабатывайте на авторских экскурсиях” from the `InfoHero` subtitle.
3. Replace the first `BENEFITS` card entirely; do not keep “Большая часть дохода — вам”, “большая часть выручки”, “скрытых сборов”, or “платных подписок”.
4. Update `STEPS` so the public promise matches the actual submit requirements: profile, legal data, qualification document, passport/selfie, manual review.
5. Decide whether final copy says “аккредитированные”, “проверенные”, or “подтверждённые”. Use “аккредитированные” only if this is a product/legal term, not just a marketing synonym.
6. Add a small page test for `/become-a-guide` copy if the project’s server component test setup supports it. Assertions: old income copy absent; new verification/accreditation copy present; CTA still links to `/auth?role=guide`.
7. Run `bun run typecheck` and `bun run lint`.
8. Browser-check `/become-a-guide` at desktop and mobile widths. Acceptance: three cards align cleanly, no text overflow, CTA remains visible, no custom CSS classes or inline layout styles added.

**6. Risk Notes**

Do not change Supabase schema, RLS, admin moderation, or verification actions for this screenshot fix. The issue is public-page positioning, not data enforcement.

Do not promise exact review timing beyond what the product already says. Current public page says 24–48 hours, while the verification form says 1–2 рабочих дня; standardize to one wording to avoid support disputes.

Do not claim revenue share, no fees, no subscriptions, payment safety, or payout timing unless those terms exist in product policy and implementation.

Do not make certificate upload sound optional on the marketing page if guide approval requires a `guide_licenses` qualification record. The upload widget’s certificate slot is optional, but `submitForVerification` requires at least one qualification document elsewhere, so copy must describe the full profile flow, not just the upload widget.

---

# image6

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

---

# image7

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

---

# image8

## 1. Screenshot Identity

Route: `/requests/[requestId]` request detail, likely owner/post-create state because the green success alert says: “Открытая экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться.”

Visible UI:
- Immersive photo hero.
- Breadcrumb-like line: `Поездки > Россия > Москва`.
- Main title: `Москва`.
- Floating trip details panel: `30 июня`, `11:00–13:00`.
- Success alert below hero.

Screenshot-specific complaint: breadcrumb is wrong, not clickable, and uses the wrong public/private context.

## 2. UX/Product Diagnosis

The main defect is semantic, not just visual.

`Поездки > Россия > Москва` tells the user they are inside “Trips,” but this page is an open request/open group detail under `/requests`. “Поездки” sounds like a private traveler cabinet or booked trips area, not a public marketplace request. That is especially confusing because the success alert says the request was just published for guides.

`Россия` is also weak as a breadcrumb level. For Moscow it reads like a fake taxonomy rather than useful navigation. It does not help the user go anywhere, filter anything, or understand ownership/status. If the real region is unknown and only country fallback exists, it should not appear as a breadcrumb segment.

The breadcrumb visually looks interactive: small text, chevrons, conventional breadcrumb placement. But source renders plain spans, so users see a navigation affordance that cannot be used. That breaks trust because the UI borrows a navigation pattern without navigation behavior.

The title repeats the last crumb. `... > Москва` followed by huge `Москва` is acceptable only if the crumb is a true current-page marker. Since it is non-clickable and not announced as current, it becomes redundant decoration.

The page state is also mixed: “Открытая экскурсия опубликована” below a breadcrumb beginning with “Поездки” makes the user wonder whether they created a trip, an excursion, a request, or a public group.

## 3. Source/Code Investigation

Primary files to inspect/change:

- [src/app/(site)/requests/[requestId]/page.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.tsx:94)
  - `buildViewModel()` maps `request.destinationRegion` into `regionLabel`.
  - This view model feeds all request detail branches.

- [src/features/requests/components/request-detail-screen.tsx](/Users/idev/provodnik/src/features/requests/components/request-detail-screen.tsx:256)
  - Public branch hard-codes:
    `[{ label: "Поездки" }, { label: viewModel.regionLabel }, { label: viewModel.title }]`
  - Owner branch separately builds the same idea at line 628:
    `Поездки`, optional region, title.
  - This duplication is likely why the wrong breadcrumb appears across roles.

- [src/components/shared/immersive-hero.tsx](/Users/idev/provodnik/src/components/shared/immersive-hero.tsx:8)
  - `HeroBreadcrumbItem` only supports `{ label: string }`.
  - Rendering uses `<span>`, not `Link`, so crumbs cannot be clicked.
  - If breadcrumbs remain visually breadcrumb-like, this component should support optional `href` and `aria-current`.

- [src/data/supabase/queries/core.ts](/Users/idev/provodnik/src/data/supabase/queries/core.ts:422)
  - `mapRequestRow()` sets:
    `destinationRegion: meta.regionLabel ?? row.region ?? "Россия"`
  - The `"Россия"` fallback is leaking into UI as if it were meaningful hierarchy.

- [src/data/supabase/queries.ts](/Users/idev/provodnik/src/data/supabase/queries.ts:266)
  - `getRequestById()` fetches the request and maps it through `mapRequestRow()`.

- [src/lib/navigation.ts](/Users/idev/provodnik/src/lib/navigation.ts:20)
  - Public `/requests` route label is currently `Запросы`.
  - Product surfaces also use “Открытые группы” in cards/comments, so the executor should align naming deliberately.

Tests to inspect/change:
- [src/features/requests/components/request-detail-screen.test.tsx](/Users/idev/provodnik/src/features/requests/components/request-detail-screen.test.tsx:1)
- [src/components/shared/immersive-hero.test.tsx](/Users/idev/provodnik/src/components/shared/immersive-hero.test.tsx:1)
- [src/app/(site)/requests/[requestId]/page.test.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.test.tsx:1)

## 4. Redesign/Fix Strategy

Recommended behavior:

Before:
`Поездки > Россия > Москва`

After, public/open request context:
`Открытые группы > Москва`

Better if a real region exists:
`Открытые группы > Калмыкия > Элиста`

For owner post-create state:
`Мои запросы > Москва` or `Открытые группы > Москва`, depending on the intended mental model:
- Use `Мои запросы > Москва` if this branch is primarily the owner managing their own request.
- Use `Открытые группы > Москва` if the owner is previewing the public page they just published.

My recommendation for this screenshot: use `Открытые группы > Москва`, because the success state says the request is published and visible to guides.

Clickable behavior:
- First crumb links to `/requests`.
- Region crumb links only if there is a real destination/region route available. Do not invent dead links.
- Current city crumb is non-clickable and marked with `aria-current="page"`.
- If only the country fallback is available (`Россия`), omit it.

Russian copy suggestions:
- Breadcrumb root: `Открытые группы`
- Owner private alternative: `Мои запросы`
- Success alert: current text is understandable, but “Открытая экскурсия” conflicts with “запрос/группа”. Prefer:
  `Открытая группа опубликована — гиды увидят запрос и смогут предложить маршрут.`
- If product wants to keep “экскурсия”, then root breadcrumb should not be “Поездки”; use:
  `Открытые экскурсии > Москва`

Implementation shape:
- Add a small helper near `RequestDetailScreen`, for example `buildRequestDetailBreadcrumb(viewModel, context)`.
- Drop region crumb when `regionLabel` is empty, equals `Россия`, or equals `viewModel.title`.
- Normalize labels like `Калмыкия · Россия` to `Калмыкия` for breadcrumb display.
- Extend `HeroBreadcrumbItem` to `{ label: string; href?: string; current?: boolean }`.
- Render `Link` for items with `href`; render span for current item.
- Keep Tailwind-only styling. No custom CSS classes beyond existing hero classes.

## 5. Implementation Checklist

1. Decide canonical route label for `/requests`: `Открытые группы` vs `Запросы`. For this screenshot, use `Открытые группы`.
2. Update breadcrumb construction in both public and owner branches of `RequestDetailScreen`; remove duplicated ad hoc arrays.
3. Add breadcrumb sanitization:
   - omit `Россия`;
   - omit region equal to city/title;
   - strip trailing country from labels like `Калмыкия · Россия`.
4. Update `ImmersiveHero` breadcrumb type to support optional `href/current`.
5. Render clickable crumbs with `next/link`; current crumb as plain text with `aria-current="page"`.
6. Add tests:
   - public request renders `Открытые группы` linking to `/requests`;
   - does not render `Россия` when it is just fallback;
   - current city crumb is not a link;
   - real region appears when specific.
7. Browser checks:
   - desktop hero matches screenshot composition;
   - mobile breadcrumb wraps cleanly and does not collide with title/panel;
   - click `/requests` crumb returns to open groups marketplace.
8. Verification:
   - `bun run typecheck`
   - `bun run lint`

Acceptance criteria:
- No request detail page shows `Поездки > Россия > Москва`.
- Breadcrumb root reflects the `/requests` marketplace, not private trips.
- Visible breadcrumb affordances are clickable where they imply navigation.
- No schema or RLS changes are needed.

## 6. Risk Notes

Do not “fix” this in the database by changing stored `region` values. The problem is UI semantics and fallback handling.

Be careful changing `ImmersiveHero`: it is shared by listing detail pages too. Optional `href` must preserve existing label-only usage.

Do not make `Россия` a clickable crumb unless there is a real country-level destination page. A fake link is worse than the current fake hierarchy.

Do not rename global navigation casually. `src/lib/navigation.ts` uses `Запросы`, while product UI references “Открытые группы”; align only after checking broader copy impact.

No RLS/auth/schema change is indicated for this screenshot. The route already gates private/non-assembly requests in [page.tsx](/Users/idev/provodnik/src/app/(site)/requests/[requestId]/page.tsx:321); keep that behavior unchanged.

---

# image9

## 1. Screenshot Identity — `/admin/guides`

Visible UI: protected admin shell with left sidebar, active item `Гиды` showing count `1`, and a centered red error card:

- `Ошибка админки`
- `Действие не выполнено`
- `Не удалось выполнить действие в админке. Попробуйте ещё раз или напишите в поддержку.`
- buttons: `Повторить`, `К панели`, `Войти снова`

Screenshot-specific complaint: admin opened `/admin/guides` to check whether a guide verification application arrived, but the queue renders only a generic failure state. The sidebar count suggests one guide item exists, yet the main content gives no confirmation, no queue context, and no next diagnostic path.

## 2. UX/Product Diagnosis

The main issue is state clarity. This is not presented as “guide queue failed to load”; it says “action failed,” which implies the admin clicked an approve/reject action. In this screenshot the likely failure is page/data loading, so the copy sends the admin in the wrong mental direction.

The sidebar badge `1` is the only evidence that a guide application may exist. The error card does not reconcile that signal. A human admin sees “Гиды 1” plus a fatal page error and cannot tell whether:

- the guide application arrived,
- the queue query failed,
- their admin session is invalid,
- Supabase/admin environment is misconfigured,
- the guide exists but is in draft rather than submitted state.

Hierarchy is too generic. The card title `Действие не выполнено` is louder than the actual task. For an operational admin page, the primary message should be queue-specific: `Не удалось загрузить заявки гидов`.

Affordances are weak. `Повторить` is fine for transient errors, but `К панели` and `Войти снова` are not enough. The admin needs routes that answer the actual question: submitted queue, drafts, audit/moderation cases, dashboard.

Trust is damaged because the failure appears at the moment of verification. Admin tools must make backend uncertainty explicit: “заявка могла прийти, но список сейчас недоступен” is better than implying no result.

Spacing/visuals are acceptable within the current brand shell, but the red card is oversized for an operational panel and leaves the rest of the workspace empty. Keep Provodnik tokens/shadcn, but make this an inline queue error state under the page header, not a generic app-level failure whenever possible.

## 3. Source/Code Investigation

Likely source locations:

- `/admin/guides` page: [src/app/(protected)/admin/guides/page.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.tsx:105)
  - The page calls `const guides = await getGuideReviewQueue({ view });` directly at line 112.
  - Any thrown error escapes to the admin error boundary.
  - Normal queue UI, filters, empty state, and guide rows are below that call, so they never render on failure.

- Admin error boundary: [src/app/(protected)/admin/error.tsx](/Users/idev/provodnik/src/app/(protected)/admin/error.tsx:15)
  - `resolveAdminErrorMessage` only distinguishes admin access and missing Supabase admin env.
  - Default copy at line 29 is generic action failure.
  - Title at line 46 is hard-coded `Действие не выполнено`.

- Moderation service: [src/lib/supabase/moderation.ts](/Users/idev/provodnik/src/lib/supabase/moderation.ts:697)
  - `getGuideReviewQueue` requires admin session, reads `guide_profiles`, then loads related `profiles`, `moderation_cases`, and latest actions.
  - Errors thrown at profile query, profile lookup, moderation cases, or action lookup all collapse the full page.
  - Contrast: `getGuideReviewDetail` uses `Promise.allSettled` and logs partial failures for documents/cases/licenses at [src/lib/supabase/moderation.ts](/Users/idev/provodnik/src/lib/supabase/moderation.ts:770). The queue page lacks that resilience.

- Tests: [src/app/(protected)/admin/guides/page.test.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.test.tsx:86)
  - Current tests cover happy path, drafts, invalid view, and empty states.
  - Missing test: queue fetch rejects and page renders a queue-specific recoverable error instead of throwing to `admin/error.tsx`.

- Sidebar/count source:
  - [src/app/(protected)/admin/layout.tsx](/Users/idev/provodnik/src/app/(protected)/admin/layout.tsx:57) calls `getAdminNavCounts`.
  - [src/app/(protected)/admin/admin-sidebar-nav.tsx](/Users/idev/provodnik/src/app/(protected)/admin/admin-sidebar-nav.tsx:1) renders the `Гиды` count.
  - In the screenshot, this path succeeds enough to show `1`, while the guide queue page fails.

Schema/RLS context:

- `guide_profiles.verification_status` enum includes `draft`, `submitted`, `approved`, `rejected`.
- Admin RLS policies allow admin access to `guide_profiles`, `moderation_cases`, and `moderation_actions`.
- If this fails in production, likely causes are admin role/session mismatch, missing Supabase admin env, schema drift, RLS/helper function issue, or a related query failure rather than the guide application being absent.

## 4. Redesign/Fix Strategy

Before:

- Page-level failure shows generic admin boundary.
- Copy: `Действие не выполнено`.
- Recovery: retry, dashboard, login.
- Admin cannot answer: “did the application arrive?”

After:

Keep the admin shell and page header visible. Catch queue load failures inside `/admin/guides` and render a route-specific inline error panel.

Suggested copy:

Title:
`Заявки гидов не загрузились`

Body:
`Не удалось получить очередь анкет со статусом «На проверке». Заявка могла прийти, но список сейчас недоступен. Обновите страницу или проверьте черновики и журнал аудита.`

Small diagnostic line:
`Если число рядом с «Гиды» в меню больше нуля, в системе есть заявки, но таблица очереди сейчас не открылась.`

Buttons:

- Primary: `Повторить загрузку` -> link to current `/admin/guides` URL.
- Secondary: `Открыть черновики` -> `/admin/guides?view=drafts`.
- Secondary: `К аудиту` -> `/admin/audit`.
- Optional secondary: `К панели` -> `/admin/dashboard`.

Normal page improvements:

- Keep filters `На проверке` and `Черновики`, but if counts are available, render `На проверке 1`, `Черновики 0`.
- Empty state should be more explicit:
  - `Нет заявок на проверке. Если гид только начал анкету, проверьте вкладку «Черновики».`
- Row metadata should include moderation status if present:
  - `Кейс: открыт · причина: Документы гида на проверке`
  - If no case: `Кейс модерации ещё не создан`
- Avoid direct approve/reject from the queue dropdown if the detail page is the safer review surface. If retained, failures should return inline action errors, not the global admin boundary.

Implementation direction:

- In `AdminGuidesPage`, wrap only `getGuideReviewQueue({ view })` in `try/catch`.
- On catch, log server-side with existing `logError` pattern if available, then render a `GuideQueueLoadError` component.
- Do not expose raw Supabase error messages to the UI.
- Leave `src/components/ui` untouched.
- Use Tailwind/shadcn tokens only: `bg-destructive/10`, `border-destructive/30`, `rounded-card` or existing local radius pattern.

## 5. Implementation Checklist

1. Add a queue-specific error branch in [src/app/(protected)/admin/guides/page.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.tsx:105).
2. Preserve the page header and filter tabs even when queue data fails.
3. Add `GuideQueueLoadError` local component with Russian copy above.
4. Add links for retry/current view, drafts, audit, dashboard.
5. Consider making `getGuideReviewQueue` more resilient:
   - `guide_profiles` failure remains fatal.
   - related `profiles`, `moderation_cases`, `moderation_actions` failures can degrade to missing account/case metadata with logged errors, similar to `getGuideReviewDetail`.
6. Add tests in `src/app/(protected)/admin/guides/page.test.tsx`:
   - `getGuideReviewQueue` rejects -> renders `Заявки гидов не загрузились`.
   - filter links still visible.
   - no raw backend error is rendered.
7. Add or update moderation service tests if partial-failure behavior is changed.
8. Browser checks:
   - `/admin/guides` with submitted guide.
   - `/admin/guides?view=drafts`.
   - forced/mock queue failure.
   - mobile admin tabs do not overlap the error panel.
9. Verification:
   - `bun run typecheck`
   - `bun run lint`
   - Screenshot compare for `/admin/guides` error and normal queue states.

Acceptance criteria:

- Admin can tell whether they are seeing a queue load failure, not an action failure.
- The UI explains that a sidebar count may still indicate existing applications.
- The admin has a clear path to submitted queue, drafts, audit, and dashboard.
- A related metadata failure does not unnecessarily hide the entire guide queue.

## 6. Risk Notes

Do not change RLS as a first response. The screenshot is evidence of a surfaced failure, not proof that RLS is wrong.

Do not collapse `draft` and `submitted`. The product needs both states: “started application” vs “ready for admin review.”

Do not expose Supabase error strings, SQL details, service-role configuration, or internal credentials in the UI.

Be careful with `requireAdminSession`: both the page and moderation helpers rely on it. Avoid adding duplicate role logic in components.

If changing `getGuideReviewQueue` to partial failure mode, keep the primary `guide_profiles` query strict. Showing an empty queue when the primary query failed would be worse than the current red card because it could falsely imply no applications arrived.