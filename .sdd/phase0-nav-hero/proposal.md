# Proposal: phase0-nav-hero
date: 2026-03-30
status: draft

## Intent
Bring the homepage header and hero back into exact alignment with `D:\dev\projects\provodnik\DESIGN.md` so the first screen matches the validated visual system instead of the current mixed implementation. This change matters because the current homepage breaks core design rules in the highest-visibility area: the nav still reflects an old IA and glass treatment, the fixed header is not offset in `(home)` layout, and the hero uses inline styles, the wrong image, and the wrong CTA hierarchy.

## Scope
### In Scope
- Update `src/components/shared/site-header.tsx` to the three-link center nav and two-CTA right rail defined in `DESIGN.md`
- Adjust homepage header styling in `src/app/globals.css` so the nav is a fixed glass pill using the design token values and active-state dot treatment
- Add fixed-header top offset to `src/app/(home)/layout.tsx` so hero content clears the floating nav
- Refactor `src/features/homepage/components/homepage-hero.tsx` to a CSS-class-based hero with the specified image, lighter directional overlay, and correct CTA hierarchy
- Add or revise only nav- and hero-related rules in `src/app/globals.css`, including mobile behavior and dark-surface token remapping for hero text

### Out of Scope
- Any redesign beyond the navbar and homepage hero
- Changes to other public pages, footer structure, or shared UI primitives under `src/components/ui`
- New product logic, routing changes beyond link targets already implied by the request, or any backend/Supabase work
- Broader CSS cleanup outside the nav and hero rule set

## Approach Options

### Option A: Targeted Design-Token Realignment
Keep the existing component boundaries, replace the outdated nav structure in `site-header.tsx`, wrap `(home)` children in the same `pt-[88px]` offset used by `(site)`, and rewrite the hero markup to use semantic structure plus dedicated global classes instead of inline styles.
**Pros:** Smallest coherent change; directly matches the requested files in scope; preserves current route/layout composition; removes inline-style drift in the hero; lowest regression risk outside the first screen.
**Cons:** Requires careful CSS additions in `globals.css` to avoid collisions with existing public-page styles; still depends on the current component split rather than a shared photo-hero abstraction.

### Option B: Shared Hero/Nav Abstraction Pass
Introduce reusable homepage-specific nav and hero class systems, potentially including a shared photo-hero utility pattern, then update the homepage to consume those abstractions while keeping the visible result identical to `DESIGN.md`.
**Pros:** Cleaner longer-term structure; can reduce repeated hero/photo rules if similar fixes continue on other pages; improves consistency if more design corrections are queued next.
**Cons:** Broader than the request; higher chance of touching unrelated areas; slower to spec and implement; increases risk of accidental visual regressions on already-aligned pages.

### Option C: CSS-Only Patch With Minimal TSX Changes
Leave most JSX intact, patch the nav and hero visually through `globals.css`, and make only the smallest markup edits needed for text/link order and layout offset.
**Pros:** Fastest path if judged only by rendered appearance; fewer component edits.
**Cons:** Not viable against the stated constraints because the current hero relies heavily on inline styles and the nav contains the wrong information architecture; would preserve brittle structure and keep design drift embedded in markup.

## Recommendation
Option A because it is the narrowest approach that fully satisfies the validated design spec, the no-inline-styles constraint, and the requested file scope without expanding into unnecessary abstraction work.

## Affected Areas
- `src/components/shared/site-header.tsx`
- `src/features/homepage/components/homepage-hero.tsx`
- `src/app/(home)/layout.tsx`
- `src/app/globals.css`
- Homepage route rendering under `src/app/(home)`

## Rollback Plan
Revert the four touched files to their previous versions, restoring the current header structure, homepage hero markup, and `(home)` layout wrapper. If rollback is needed after deployment, the safest path is a single commit revert of the change set so the prior header, hero image, and layout spacing return together rather than partially.

## Open Questions
- none
