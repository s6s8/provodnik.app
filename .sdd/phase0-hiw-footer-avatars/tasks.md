# Tasks: phase0-hiw-footer-avatars
date: 2026-03-30
total: 8

## Phase 1: Foundation

- [ ] **T01** — `src/app/globals.css`: add section-scoped styles for the homepage process flow, connector visibility, avatar stack geometry/fallback states, and footer link states; keep all presentation in the global stylesheet.
  - Spec: How It Works Section Presentation; Avatar Chip Fallback Rendering; Footer Link Set and Socials.
  - Accept: CSS classes exist for the scoped patterns, no inline styles are needed for these surfaces, and the selectors support the five-step layout, 28x28 avatars, and valid footer link states.

## Phase 2: UI

- [ ] **T02** — `src/features/homepage/components/homepage-process.tsx`: convert the current three-step inline-styled block into the five-step How It Works flex flow with desktop-only connectors and class-based markup.
  - Spec: Five-Step How It Works Flow; How It Works Section Presentation.
  - Accept: The component renders five ordered steps, preserves the `#hiw` anchor, uses no inline styles, and exposes class hooks for desktop connectors and responsive stacking.

- [ ] **T03** — `src/features/homepage/components/homepage-gateway.tsx`: update avatar chip rendering to use fixed-size overlapping circles, image fallback handling, and initials when an avatar URL is missing or fails.
  - Spec: Avatar Chip Fallback Rendering; Gateway Participant Avatars.
  - Accept: A missing or broken avatar URL shows initials instead of a broken image, each chip remains 28x28 with the specified overlap/border behavior, and no inline styles are used.

- [ ] **T04** — `src/components/shared/site-footer.tsx`: replace placeholder footer destinations with live in-app routes or the homepage anchor and constrain social links to VK and Telegram while preserving the copyright line.
  - Spec: Valid Footer Destinations; Footer Link Set and Socials.
  - Accept: Every visible footer link resolves to a real destination, only VK and Telegram appear in the social area, and the copyright text remains exact.

## Phase 3: Validation

- [ ] **T05** — Run `bun run build`.
  - Spec: all scoped behaviors compile cleanly after implementation.
  - Accept: Next.js production build succeeds with no errors.

- [ ] **T06** — Run `bun run typecheck`.
  - Spec: all scoped behaviors are type-safe after implementation.
  - Accept: TypeScript checks pass with no errors.

- [ ] **T07** — Run `bun run lint`.
  - Spec: repo standards for formatting and linting are satisfied.
  - Accept: ESLint finishes with no errors or warnings.

- [ ] **T08** — Run `bun test`.
  - Spec: existing test coverage, if any, remains green.
  - Accept: Test command passes or confirms there is no test suite to execute.
