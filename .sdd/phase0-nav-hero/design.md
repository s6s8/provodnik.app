# Design: phase0-nav-hero
date: 2026-03-30
stack: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 + bun

## Architecture Decision
Use the existing shared-header plus homepage-feature composition and realign it to `D:\dev\projects\provodnik\DESIGN.md` with a narrow presentation-layer change. The header remains a single shared client component consumed by the `(home)` layout, while the homepage hero remains a dedicated feature component, but both stop relying on legacy IA and inline styling. The design work is concentrated in `globals.css` so the validated glass, overlay, spacing, and dark-surface token rules live in the current global style system instead of being duplicated inside TSX.

## Files to Create
| File | Purpose |
|---|---|
| None | No new files are required for this change |

## Files to Modify
| File | What Changes |
|---|---|
| `src/components/shared/site-header.tsx` | Replace the four-link nav model with the validated three-link center nav, keep active-link detection, and preserve the existing sign-in plus create-request CTA structure with updated targets and labels |
| `src/features/homepage/components/homepage-hero.tsx` | Remove inline styles and the search-form interaction, switch to class-based cinematic hero markup, add validated kicker/headline/supporting-copy structure, and expose the primary create-request CTA plus secondary find-group navigation link |
| `src/app/(home)/layout.tsx` | Add a homepage-only top offset wrapper so the fixed floating header clears the first screen while still allowing the hero to visually align with the overlaid nav treatment |
| `src/app/globals.css` | Update shared header styles to the validated glass-pill nav, add homepage-hero-specific classes for background media, overlay, scoped dark-surface text tokens, CTA row, and mobile spacing rules, and add the homepage layout offset/bleed helpers needed by `(home)` |

## Files to Delete
| File | Reason |
|---|---|
| None | No files are deleted in this change |

## Data Flow
1. `src/app/(home)/layout.tsx` renders `SiteHeader` above the homepage content and wraps the page content in a fixed-header clearance container.
2. `SiteHeader` reads `usePathname()` and compares the current pathname against the validated public targets: `/destinations`, `/guides`, and the homepage how-it-works anchor target (`/#hiw` rendered as a non-active anchor link on non-home routes).
3. Global header CSS applies the frosted pill shell, active-link dot, and responsive compression rules so the same component works on desktop and mobile across public pages.
4. `HomePageHero` renders a semantic hero section with a background-image layer, a lighter directional overlay, and a content stack containing kicker, headline, supporting text, and CTA row.
5. Hero-specific CSS scopes white-on-dark token overrides to the hero subtree only, so the first screen gets readable contrast over photography without mutating downstream homepage sections.
6. CTA clicks continue through existing Next.js navigation targets only: primary to `/requests/new`, secondary to `/requests`, with no dependency on Supabase or dynamic homepage data.

## API Changes
No API changes

## Schema Changes
No schema changes

## Component Architecture
`SiteHeader`
- Responsibility: shared public fixed navigation bar.
- Structure: wordmark link, center nav list, right CTA rail.
- Nav model: three center entries only.
- Targets: `/destinations`, `/guides`, `/#hiw`.
- Active-state rule: pathname-based active styling remains for route-backed links; the anchor link does not introduce new router state and should only render as an in-page jump target.

`HomePageHero`
- Responsibility: homepage-first visual entry section only.
- Structure:
  - hero shell section
  - absolutely positioned background-image layer
  - overlay layer
  - content container
  - glass kicker pill
  - headline and supporting copy block
  - CTA row with one primary button and one text link
- Removed child: inline search form and its input/button interaction.
- Parent/child relationship: still rendered from the homepage shell; no shared primitives are introduced.

`(home) layout`
- Responsibility: homepage-specific composition around the shared fixed header.
- Structure change: wrap `children` in a layout container or main element that adds top clearance while allowing the hero section to offset that clearance visually with an existing or new bleed helper class.

## State Management
No new client, server, URL, or database state is introduced.

Existing state usage remains:
- `usePathname()` in `SiteHeader` continues to drive active-route styling.
- Hero CTA behavior is static link navigation only.
- No search form state remains in the homepage hero after this change.

## Decisions & Rationale
| Decision | Why |
|---|---|
| Keep `SiteHeader` as the single shared public header component | The change is an IA and styling correction, not a header architecture split; keeping one component avoids divergence across homepage and other public routes |
| Add homepage header clearance in `src/app/(home)/layout.tsx` instead of inside the hero component | Fixed-header spacing is a layout concern, and solving it at the layout layer avoids coupling every homepage section to header height assumptions |
| Use a hero bleed/helper pattern to visually preserve the over-photo nav composition | The spec requires content to clear the fixed header while the hero still appears visually aligned with the floating nav treatment |
| Move hero presentation to CSS classes in `globals.css` | The current hero drifts from the validated design because key values are embedded inline; centralizing them restores the design-token source of truth and matches the rest of the public rewrite |
| Remove the hero search form entirely | The approved first-screen interaction is action-led, not search-led, and the spec explicitly removes the search-first behavior |
| Keep CTA targets on existing routes only | The task is visual/compositional; it must not invent new backend or routing behavior |
| Scope dark-surface overrides to the hero subtree | The spec requires readable hero contrast without changing the rest of the homepage token behavior |

## Risks
- The shared header is used across public pages, so nav spacing and the updated three-link IA must be checked on non-home routes to ensure the narrower link set and pill sizing do not regress other layouts.
- The `/#hiw` anchor is a homepage section target, not a standalone route, so active-state behavior for that entry should remain intentionally limited unless a separate cross-route anchor strategy is introduced later.
- Moving the hero from inline styles to global classes can expose CSS-order or selector-collision issues because `globals.css` already contains broad public-page utilities and hero helpers.
- The homepage clearance plus hero bleed values depend on the fixed header height staying stable; if header padding changes later without updating the paired offset token/value, the first screen can reintroduce clipping or create a visible gap.
