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