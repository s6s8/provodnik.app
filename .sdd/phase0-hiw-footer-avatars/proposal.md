# Proposal: phase0-hiw-footer-avatars
date: 2026-03-30
status: draft

## Intent
Align the homepage How It Works block, footer, and gateway avatar chips with `DESIGN.md` so the public homepage stops relying on inline styles, dead links, and broken avatar rendering. The change keeps the existing component/file structure intact while replacing the weak presentation with the five-step flex pattern, real navigation targets, and spec-compliant avatar chips that degrade cleanly to initials.

## Scope
### In Scope
- Rebuild `src/features/homepage/components/homepage-process.tsx` into a five-step card/pill layout that follows `DESIGN.md` Section 6 flex steps with desktop-only connectors and no inline styles.
- Update `src/components/shared/site-footer.tsx` so all footer links point to real routes or a homepage anchor, social links are limited to VK and Telegram, and the copyright line stays `© 2026 Provodnik. Все права защищены.`
- Fix the avatar chip rendering in `src/features/homepage/components/homepage-gateway.tsx` so broken avatar URLs fall back to working avatars or initials and the avatar stack matches the 28x28 / 2px border / -6px overlap spec without inline styles.
- Add or adjust shared CSS in `src/app/globals.css` for process, footer, and avatar presentation rules.

### Out of Scope
- Changing route structure or adding new routes.
- Editing unrelated homepage sections, protected areas, or shared primitives outside the listed files.
- Changing the Russian copy itself beyond wiring in the exact request text during implementation.
- Introducing inline styles, new design-system primitives, or payment/product logic.

## Approach Options

### Option A: Localized CSS-first refactor
Keep the same components and data flow, but replace the inline styling in the three components with semantic markup plus new global CSS classes in `globals.css`.
**Pros:**
- Smallest change surface.
- Matches the existing repo rule that globals.css is the visual source of truth.
- Lowest risk to routing and component behavior.
**Cons:**
- Adds a few section-specific selectors to the global stylesheet.
- Requires careful class naming to avoid collisions.

### Option B: Shared micro-primitives
Extract reusable process-step, footer-link, and avatar-stack primitives, then consume them from the homepage and footer components.
**Pros:**
- Better long-term reuse if more pages need the same patterns.
- Reduces duplicate styling logic.
**Cons:**
- Broader refactor than the request needs.
- Higher regression risk for a narrow visual fix.

### Option C: Minimal patch only
Fix only the visibly broken pieces with the least structural change possible, leaving most styling decisions inside the current components.
**Pros:**
- Fastest path to a green build.
- Very low implementation time.
**Cons:**
- Conflicts with the no-inline-styles requirement.
- Would keep the current ad hoc presentation and likely drift from `DESIGN.md`.

## Recommendation
Option A because it is the smallest change that fully satisfies the design constraints, removes inline styles, and keeps the existing routing/component boundaries intact.

## Affected Areas
- `src/features/homepage/components/homepage-process.tsx`
- `src/components/shared/site-footer.tsx`
- `src/features/homepage/components/homepage-gateway.tsx`
- `src/app/globals.css`

## Rollback Plan
If the implementation breaks build or visual fidelity, revert only the four scoped files above to the previous commit state. This restores the current homepage, footer, and avatar rendering without affecting routes, data contracts, or other sections.

## Open Questions
- None. The route targets, footer copy, and design constraints are explicit enough to proceed into spec and implementation.
