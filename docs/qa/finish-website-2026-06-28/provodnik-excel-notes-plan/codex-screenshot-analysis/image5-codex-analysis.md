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