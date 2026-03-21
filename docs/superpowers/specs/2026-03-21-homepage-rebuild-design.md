# Provodnik Homepage Rebuild Design

## Goal

Rebuild the `/` homepage as a clean, desktop-first implementation that matches the approved warm editorial glassmorphism reference image and prompt, replacing the current homepage composition rather than iterating on the existing section implementation.

## Source Of Truth

Homepage authority is defined in this order:

1. `D:\dev\projects\provodnik\design\images\01-home-full-202621031513.jpeg`
2. `D:\dev\projects\provodnik\design\images\01-home-full-202621031513.md`
3. `D:\dev\projects\provodnik\design\HOMEPAGE-SPEC.md`

The older dark-theme homepage direction in `D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md` does not apply to `/` for this rebuild. It remains historical context for other routes only.

## Design Intent

The homepage should feel like a premium travel marketplace presented through warm editorial glassmorphism:

- warm off-white page canvas
- frosted translucent navigation and cards
- cinematic travel photography with bright atmospheric haze
- elegant serif display typography paired with restrained sans-serif UI text
- soft, creamy borders and shadows rather than hard contrast
- compact, high-value section rhythm with no generic SaaS styling

The target is not “inspired by” the reference. The target is perceptual fidelity at the primary desktop viewport.

## Success Criteria

The rebuilt homepage is successful when:

- the first screen reads like the reference in one glance
- nav, hero, gateway overlap, and destination grid proportions match the reference closely
- glass surfaces feel translucent and layered rather than opaque white
- text hierarchy, spacing, and card density align with the image
- the page is implemented as a fresh homepage module with clear section ownership
- the route is production-ready and builds cleanly

## Viewport And Fidelity Rules

Primary review viewport:

- desktop width: 1440px
- browser content area used for visual QA against the reference screenshot

Desktop fidelity is the first priority. Responsive behavior should remain sane and non-broken, but the design target is the desktop composition shown in the approved image.

## Visual System

### Palette

Use the warm palette already reflected in the newer homepage spec:

- background: `#F9F8F7`
- surface: `#F2EDE6`
- card: `#FFFFFF`
- glass fill: translucent white around 55% to 75% depending on layer
- primary teal: `#0F766E`
- secondary teal: `#14B8A6`
- highlight teal: `#2DD4BF`
- amber accent: `#D97706`
- text-primary: `#0F172A`
- text-secondary: `#475569`
- text-muted: `#94A3B8`
- border: `#CBD5E1`
- border-light: `#E2E8F0`

### Typography

- Display: Cormorant Garamond
- UI/body: Inter
- Hero headline is editorial, large, and centered
- Section titles use semibold sans, not serif

### Surface Language

Every major homepage surface should follow one of three patterns:

1. `hero glass`
   Use for nav and search shell. Higher translucency, stronger blur, lighter border.
2. `gateway glass`
   Use for the two entry cards. Frosted but still substantial enough to hold dense content.
3. `photo overlay card`
   Use for destinations and listings. Photography-forward with bottom gradient for legible text.

## Information Architecture

The homepage keeps the approved order:

1. floating nav over hero
2. compact hero with headline, search, and CTAs
3. overlapping dual gateway cards
4. popular destinations grid
5. how-it-works strip
6. trust cards
7. editorial footer

## Content Rules

- Russian UI copy only
- no lorem ipsum
- no obviously generated broken copy
- no repeated placeholder content that makes cards feel fake
- copy should preserve the reference’s concise tone

Some micro-copy in `HOMEPAGE-SPEC.md` is corrupted. Those strings must be normalized to clean Russian while preserving meaning and density from the image.

## Architecture

Implement the homepage as a dedicated module rooted at `src/features/homepage/components`.

The route file at `src/app/(home)/page.tsx` should become a thin entry point that renders a single shell component from that module.

The existing `src/features/home/components/*` files are not the foundation for this rebuild. They should be treated as legacy homepage experiments unless actively reused by explicit choice.

## Section Responsibilities

- `homepage-shell.tsx`
  Owns page composition, background, section ordering, and shared container rhythm.
- `homepage-content.ts`
  Owns static homepage copy, link targets, image URLs, badges, and repeated card data.
- `homepage-navbar.tsx`
  Owns the floating frosted nav.
- `homepage-hero.tsx`
  Owns hero image, copy, search shell, and primary CTAs.
- `homepage-gateway.tsx`
  Owns the two frosted entry cards and their internal mini-card layouts.
- `homepage-destinations.tsx`
  Owns the featured-plus-grid destination section.
- `homepage-process.tsx`
  Owns the five-step “Как это работает” strip.
- `homepage-trust.tsx`
  Owns the three trust cards.
- `homepage-footer.tsx`
  Owns the homepage-specific footer treatment.

## Quality Bar

- no emoji icons in final UI
- no flat white SaaS cards
- no dark homepage remnants
- no oversized empty hero spacing
- no dead-simple generic button treatments
- no visual dependence on the old `glass-panel` dark utility

## Verification Strategy

Visual verification should compare the rebuilt page to the approved reference after implementation using:

- full-page browser screenshot at desktop width
- section-by-section comparison for nav, hero, gateway, destinations, steps, trust, and footer
- production build success

## Approved Direction

The user explicitly approved a full homepage rebuild, not a patch, using the plan based on the approved image and warm-light spec. This document freezes that direction for implementation.
