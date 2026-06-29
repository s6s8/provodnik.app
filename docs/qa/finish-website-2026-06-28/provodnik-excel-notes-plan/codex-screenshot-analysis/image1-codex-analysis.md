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