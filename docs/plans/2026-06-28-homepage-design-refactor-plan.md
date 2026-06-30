# Homepage-Led Design Refactor Plan

> **Status:** planning only. Do **not** refactor yet.
>
> **Source of truth:** redesigned homepage at `/`, captured at 1280px and 375px in `/tmp/provodnik-homepage-analysis/`.
>
> **Claude input:** read-only Claude Code run using `/frontend-design` + `ui-ux-pro-max`; Claude's draft is at `/Users/idev/.claude/plans/frontend-design-ui-ux-pro-max-you-are-serene-milner.md`.
>
> **Hermes correction:** Claude's draft is useful for inventory and phased structure, but it under-read the screenshots and over-emphasized amber. The current homepage CTA/nav active color is blue/navy, with amber only as a rare warm accent.

## Goal

Refactor all non-homepage pages to follow the homepage's clean, polished design language while preserving each page's domain behavior, data flow, copy, and role-specific UX.

This plan is a handoff for later execution by Claude/QuantumHands. It intentionally contains **no product-code changes**.

---

## Homepage design DNA

### Mood

- Calm, premium, travel-marketplace trust.
- Editorial photography + institutional navy.
- Low visual noise: one clear task per screen.
- Rounded, soft, high-confidence UI; not playful SaaS, not generic admin gray.

### Desktop reference

- Full-viewport hero with large empty breathing room.
- Floating rounded glass nav, max-width aligned, high radius.
- Central H1: short, heavy, high-contrast.
- Single elevated form card centered below H1.
- CTA is a strong blue full-width button.
- Secondary text is quiet and explanatory.
- Scroll cue is minimal.

### Mobile reference

- Hero remains photo-led and full-height.
- Header becomes a rounded pill with logo + burger.
- H1 wraps cleanly into two lines.
- Form card is nearly full-width with comfortable inner padding.
- Inputs stack into compact two-column rows only where safe; no overflow.
- CTA remains full-width and touch-sized.
- Microcopy stays below form, centered, muted.

### Reusable rules

| Area | Rule |
|---|---|
| Container | `max-w-page px-gutter` for broad pages; `max-w-2xl px-gutter` for prose/article pages |
| Page canvas | `bg-surface` / `bg-background`; no random gray backgrounds |
| Cards | `rounded-card border border-border bg-card shadow-card` |
| Hero/form card | `rounded-hero bg-surface shadow-lift` where a page needs a hero action panel |
| CTA | one primary CTA per view; shadcn `<Button>`; full-width on mobile forms |
| Typography | Onest only; `text-display` for hero; `text-section font-extrabold tracking-tight` for H2s |
| Surfaces | use `bg-surface-low` for strips; avoid opacity hacks like `bg-card/80` unless intentionally glass/photo overlay |
| Badges | use shared `<Badge>` variants; no ad-hoc colored spans |
| Photo overlays | use `<Scrim variant="hero|card">`; no inline custom gradient per page |
| Motion | subtle only; `motion-safe:*`; no `transition-all` |
| Mobile | design mobile-first; 44px+ touch targets; no horizontal scroll |
| Tokens | no new raw hex values in components; use semantic tokens from `globals.css` |

---

## Claude plan review

### Accepted from Claude's draft

- Page grouping is useful: public marketing, directories, details, auth, traveler, guide, admin, policy.
- The phased approach is correct: primitives first, low-risk public pages second, protected flows later.
- Shared primitive idea is good: `ArticleShell`, `SectionStrip`, `StepCard`, `GuideCtaBanner`.
- QA matrix for 1280px + 375px is required.
- Token discipline checklist is strong.

### Corrected / tightened

- Do not treat amber as the primary CTA color. Current homepage primary CTA is blue/navy.
- Do not force every detail/cabinet page into public landing-page aesthetics. Protected/admin pages should inherit the *cleanliness and token discipline*, not the full hero look.
- Do not blanket-replace every `rounded-xl`/`rounded-2xl`; first classify whether it is a card, modal, panel, avatar, pill, or existing shadcn primitive.
- Do not create primitives unless at least two target pages will use them immediately.
- Visual audit must use actual screenshots/browser, not code alone.

---

## Implementation phases

### Phase 0 — Foundation audit + primitives

**Goal:** create the minimum shared vocabulary needed for safe refactors.

1. Audit existing shared components:
   - `src/components/shared/page-header.tsx`
   - `src/components/shared/list-hero.tsx`
   - `src/components/shared/section-heading.tsx`
   - `src/components/shared/cabinet-shell.tsx`
   - `src/components/shared/marketing-header.tsx`
   - `src/components/shared/site-header.tsx`
   - `src/components/ui/*`
2. Create only needed primitives:
   - `ArticleShell` for prose/static pages.
   - `SectionStrip` for homepage-style horizontal bands.
   - `StepCard`/`StepBadge` if two or more pages use step explanations.
   - `GuideCtaBanner` if repeated CTAs exist in guides/listings/become-a-guide.
3. Add tests only where component behavior exists; purely visual wrappers can be covered by usage tests.
4. Verify: `bun run typecheck && bun run lint`.

### Phase 1 — Public marketing/static pages

**Goal:** make the easiest visible pages match homepage polish.

Order:
1. `/how-it-works` — align steps and article spacing.
2. `/trust` — align cards/prose surfaces.
3. `/become-a-guide` — align benefits/steps/CTA banner.
4. `/for-business` — align marketing sections.
5. `/help` — align article/help layout while preserving search/FAQ behavior.
6. policy pages — wrap prose consistently, low risk.

Verification per page:
- 1280px screenshot.
- 375px screenshot.
- no horizontal scroll.
- no console errors.
- typecheck + lint.

### Phase 2 — Public marketplace directories

**Goal:** directory pages feel like part of the same product, without losing filtering/list density.

Order:
1. `/guides`
2. `/destinations`
3. `/listings`
4. `/requests`
5. `/search`

Refactor targets:
- consistent `ListHero` / `PageHeader` usage.
- `max-w-page px-gutter` containers.
- same card surfaces and shadows as homepage cards.
- tokenized search/filter bars.
- consistent empty states.

### Phase 3 — Public detail pages

**Goal:** detail pages inherit clean cards, photo scrims, and CTA discipline.

Targets:
- `/listings/[id]`
- `/destinations/[slug]`
- `/guides/[slug]`
- `/guide/[id]`
- `/requests/[requestId]`

Rules:
- preserve data/query logic.
- preserve role-aware behavior.
- do not restructure booking/business flows.
- audit photo overlays and sticky CTA panels carefully.

### Phase 4 — Auth pages

**Goal:** auth screens become visually calm and token-consistent.

Targets:
- `/auth`
- `/auth/forgot-password`
- `/auth/update-password`

Rules:
- preserve auth action/server behavior.
- normalize forms/buttons/error surfaces.
- use homepage-level spacing and trust microcopy, but do not over-decorate.

### Phase 5 — Traveler cabinet

**Goal:** protected traveler area inherits clean hierarchy, not homepage hero treatment.

Targets:
- `/account`
- `/trips`
- `/favorites`
- `/notifications`
- `/messages`
- `/messages/[threadId]`
- `/bookings/[bookingId]`
- `/bookings/[bookingId]/review`
- `/bookings/[bookingId]/dispute`
- `/referrals`

Rules:
- use `CabinetShell` consistently.
- use `PageHeader` consistently.
- normalize cards, empty states, forms.
- keep role/state machines untouched.

### Phase 6 — Guide cabinet

**Goal:** high-complexity guide workflows become cleaner without breaking verification/listing/booking flows.

Targets:
- `/guide/inbox`
- `/guide/listings`
- `/guide/profile`
- `/guide/bookings`
- `/guide/bookings/[bookingId]`
- `/guide/calendar`
- `/guide/reviews`
- `/guide/stats`
- `/guide/settings/contact-visibility`

Rules:
- highest regression risk: handle after public/auth pages.
- preserve upload, verification, calendar, and booking logic.
- visual changes only after tests for each flow are identified.

### Phase 7 — Admin

**Goal:** token-consistent admin, not marketing-styled admin.

Targets:
- `/admin/dashboard`
- `/admin/moderation`
- `/admin/guides`
- `/admin/guides/[id]`
- `/admin/listings`
- `/admin/bookings`
- `/admin/disputes`
- `/admin/disputes/[caseId]`
- `/admin/audit`

Rules:
- preserve dense data tables.
- align KPI cards, status badges, page headers.
- do not reduce operational information density.

---

## Actionable task list

### Foundation tasks

| ID | Task | Files | Verification |
|---|---|---|---|
| F0.1 | Audit current shared shells and list what can be reused before adding primitives | shared components above | report only |
| F0.2 | Add `ArticleShell` if audit confirms ≥2 target pages | `src/components/shared/article-shell.tsx` | typecheck/lint |
| F0.3 | Add `SectionStrip` if audit confirms repeated section bands | `src/components/shared/section-strip.tsx` | typecheck/lint |
| F0.4 | Add `StepCard`/`StepBadge` only if used by how-it-works + become-a-guide | `src/components/shared/step-card.tsx` | typecheck/lint |
| F0.5 | Add `GuideCtaBanner` only if repeated CTA block exists | `src/components/shared/guide-cta-banner.tsx` | typecheck/lint |

### Phase 1 tasks

| ID | Page | Main files | Work | Verification |
|---|---|---|---|---|
| P1.1 | how-it-works | `src/app/(site)/how-it-works/page.tsx` | ArticleShell, StepCard, token headings/cards | screenshots 1280/375 + lint |
| P1.2 | trust | `src/app/(site)/trust/page.tsx` | article layout, card surfaces, badges | screenshots 1280/375 + lint |
| P1.3 | become-a-guide | `src/app/(site)/become-a-guide/page.tsx` | step cards, CTA banner, section headings | screenshots 1280/375 + lint |
| P1.4 | for-business | `src/app/(site)/for-business/page.tsx` | align sections/cards/forms | screenshots 1280/375 + tests |
| P1.5 | help | `src/app/(site)/help/page.tsx` | help layout + FAQ spacing | screenshots 1280/375 + tests |
| P1.6 | policies | `src/app/(site)/policies/*/page.tsx` | article wrapper + card surfaces | screenshots 1280/375 + lint |

### Later-phase summary tasks

| Phase | Scope | Key verification |
|---|---|---|
| P2 | public directories | filters/search/cards at 1280/375, no overflow |
| P3 | detail pages | role branches, sticky CTA, photo galleries |
| P4 | auth | login/signup/reset happy + error paths |
| P5 | traveler cabinet | CabinetShell, forms, bookings/messages |
| P6 | guide cabinet | verification/upload/calendar/listing workflows |
| P7 | admin | tables, moderation, KPI cards, badges |

---

## Visual QA checklist

For every touched page:

- [ ] 1280px screenshot saved.
- [ ] 375px screenshot saved.
- [ ] no horizontal scroll at 375px.
- [ ] main content aligns to `px-gutter`.
- [ ] cards are visually close to homepage cards: white/surface, 16–18px radius, subtle shadow.
- [ ] no new raw hex values in components.
- [ ] no new inline visual style hacks.
- [ ] one primary CTA per section/view.
- [ ] mobile touch targets are at least 44px.
- [ ] console has no errors.
- [ ] `bun run typecheck && bun run lint` passes.
- [ ] for code paths with tests, relevant tests pass.

---

## Execution `/goal` prompt — DO NOT RUN NOW

```text
/frontend-design
/ui-ux-pro-max

/goal Do not stop until Phase 0 and Phase 1 of the homepage-led Provodnik design refactor are complete, verified at 1280px and 375px, and committed in small phase/task commits — OR until a concrete blocker is proven with file paths, command output, and screenshots.

You are working in /Users/idev/provodnik.

READ FIRST:
- CLAUDE.md
- .claude/CLAUDE.md
- AGENTS.md
- .claude/rules/provodnik-orchestration.md
- docs/process/claude-build-workflow.md
- docs/plans/2026-06-28-homepage-design-refactor-plan.md
- src/app/(home)/page.tsx
- src/features/homepage-classic/components/homepage-shell2-classic.tsx
- src/features/homepage-classic/components/homepage-hero-form-classic.tsx
- src/features/homepage-classic/components/homepage-request-form-classic.tsx
- src/app/globals.css

HOMEPAGE SOURCE OF TRUTH:
- Desktop: /tmp/provodnik-homepage-analysis/homepage-1280.png
- Mobile: /tmp/provodnik-homepage-analysis/homepage-375.png

EXECUTION SCOPE FOR THIS RUN:
Phase 0 foundation audit/primitives, then Phase 1 public marketing/static pages only:
- src/app/(site)/how-it-works/page.tsx
- src/app/(site)/trust/page.tsx
- src/app/(site)/become-a-guide/page.tsx
- src/app/(site)/for-business/page.tsx
- src/app/(site)/help/page.tsx
- src/app/(site)/policies/*/page.tsx
- only shared primitives that are required by at least two touched pages

STRICT RULES:
- Do not change database queries, server actions, auth logic, role logic, or copy meaning.
- Do not redesign the homepage.
- Do not touch guide/traveler/admin/detail pages in this run.
- Do not push.
- Use semantic tokens only; no new raw hex values in components.
- Tailwind + shadcn only; no new custom CSS classes unless explicitly justified.
- Keep primary CTA blue/navy as on the current homepage; do not switch to amber.
- After each page, run targeted verification; after each phase, run `bun run typecheck && bun run lint`.

VISUAL REQUIREMENTS:
- match homepage cleanliness: `max-w-page px-gutter`, clean surface layering, rounded-card/rounded-hero, subtle shadows, Onest hierarchy, one clear CTA, mobile-first spacing.
- save screenshots for each touched page at 1280px and 375px.
- no horizontal scroll at 375px.
- no console errors.

RETURN:
- files changed
- screenshots produced
- commands run and results
- remaining risks
- exact commit SHAs
```

---

## Non-goals

- No refactor in this planning step.
- No homepage redesign.
- No protected guide/traveler/admin changes until public pages prove the pattern.
- No backend/data/auth changes.
- No copy rewrite beyond tiny clarity fixes explicitly approved later.
