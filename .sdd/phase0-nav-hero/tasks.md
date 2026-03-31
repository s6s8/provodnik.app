# Tasks: phase0-nav-hero
date: 2026-03-30
total: 6

## Phase 1: Foundation
<Global style alignment and layout scaffolding required before component rewrites>

- [ ] **T01** — `src/app/globals.css`: add the validated fixed-header glass pill rules, active-link dot treatment, homepage hero classes, scoped dark-surface token overrides, and responsive nav/hero helpers used by the homepage-first composition
  - Spec: Primary Site Navigation; Mobile Navigation Compression; Homepage Hero Glass Treatments; Hero Surface Token Override; Small Viewport Hero Readability
  - Accept: `src/app/globals.css` defines the header, hero, dark-surface, and mobile helper classes referenced by the updated homepage layout and components, with no inline-style dependency required for the hero presentation

- [ ] **T02** — `src/app/(home)/layout.tsx`: add the homepage-only fixed-header clearance wrapper and any matching bleed/helper class hooks so first-screen content clears the floating header
  - Spec: Home Layout Header Clearance
  - Accept: `src/app/(home)/layout.tsx` wraps homepage children in a layout container that applies the new header-offset helper without changing non-home layouts

## Phase 2: UI
<Shared header and homepage hero updates>

- [ ] **T03** — `src/components/shared/site-header.tsx`: replace the legacy four-link public nav with the validated three-link center navigation plus sign-in and create-request actions, preserving pathname-based active styling and mobile compression behavior
  - Spec: Primary Site Navigation; Mobile Navigation Compression; Header Across Public Routes
  - Accept: `src/components/shared/site-header.tsx` renders exactly the validated three public nav destinations, keeps only matching route-backed links active, and hides the center links plus sign-in action on mobile widths

- [ ] **T04** — `src/features/homepage/components/homepage-hero.tsx`: remove the search-led inline-styled hero and render the validated class-based cinematic hero with the approved copy hierarchy, lighter overlay usage, and create-request plus find-group CTA pair
  - Spec: Homepage Hero Composition; Homepage Hero Interaction Pattern; Search-First Hero Form; Missing Homepage Data; Local Environment Without Supabase Configuration
  - Accept: `src/features/homepage/components/homepage-hero.tsx` contains no inline hero styling or search form markup, uses the new CSS classes for presentation, and exposes only the validated primary and secondary hero actions on static routes

## Phase 3: Tests & Validation
<Required command validation>

- [ ] **T05** — Run `bun run build`
  - Spec: Validation for the full change set
  - Accept: `bun run build` exits successfully with the updated nav, layout, and hero code in place

- [ ] **T06** — Run `bun run typecheck`
  - Spec: Validation for the full change set
  - Accept: `bun run typecheck` exits successfully with no new type errors introduced by this change
