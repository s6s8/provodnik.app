# Spec: phase0-buttons-typography-glass
date: 2026-03-30
based-on: proposal.md (Option B)

## MODIFIED Behaviors

### Button Treatment on Homepage Surfaces
**Before:** Button styles on the homepage can vary by section, with primary and secondary actions sometimes relying on ad hoc emphasis or inline overrides.
**After:** Homepage buttons follow a strict two-variant rule: one primary action is visually dominant, and secondary actions remain visually subordinate.

- Given a homepage section with both a primary action and a secondary action
- When the section is rendered
- Then the primary action appears as the filled, highest-emphasis control
- And the secondary action appears as the outlined or ghost control
- And no section presents two equally emphasized primary buttons side by side

### Typography Role Split
**Before:** Headings, labels, buttons, and card text can share similar emphasis, reducing the distinction between emotional and functional copy.
**After:** Serif typography is reserved for emotional headlines and featured destination names, while sans typography is reserved for labels, buttons, metadata, and smaller card headings.

- Given the homepage hero, gateway section, and destination section are rendered
- When headings, labels, buttons, and metadata appear
- Then section-opening headlines and featured destination names use the serif role
- And labels, button text, metadata, and smaller card headings use the sans role
- And the same text role is not reused for both emotional and functional hierarchy within the same visual block

### Glass Surface Rendering
**Before:** Floating surfaces can read as flat or opaque, especially when placed over photography or tinted backgrounds.
**After:** Floating homepage surfaces read as frosted glass, with translucency, blur, border, and depth visible as part of the design language.

- Given a floating panel, pill, or overlay appears above a photographic or colored background
- When it is rendered
- Then the surface remains visibly translucent rather than opaque
- And it retains separation from the background through blur, border, and shadow
- And glass styling is not used for full-width section backgrounds

### Destination Grid Legibility
**Before:** The destination grid can crowd the right side of the layout at some widths, causing the final column to feel clipped or cramped.
**After:** The destination grid preserves full visibility of card edges, titles, and metadata, and it reflows before the right edge becomes visually cramped.

- Given the destination grid is rendered with one featured card and secondary cards
- When the viewport narrows toward tablet and smaller desktop widths
- Then the final visible column remains fully legible
- And card content does not clip against the container edge
- And the layout collapses to fewer columns before horizontal crowding harms readability

### Dark-Context Token Remapping
**Before:** Dark photographic sections depend on isolated overrides that can drift from the shared token system.
**After:** Dark-context sections remap the shared text, border, and glass tokens so light-on-dark content stays readable without changing the layout.

- Given a hero or other dark-background section is wrapped in a dark context
- When the section is rendered
- Then primary text remains readable over the dark surface or image
- And muted text, borders, and glass treatments shift to dark-context values
- And the section keeps the same spacing and hierarchy as its light-context counterpart

## ADDED Behaviors

### Empty Gateway Panel State
- Given the traveler or guide panel has no cards to show
- When the gateway section is rendered
- Then the empty-state message appears instead of a broken or partial card grid
- And the panel still shows the correct primary call to action
- And the empty state remains centered and visually balanced within the glass panel

### Empty Destination Section State
- Given there are no destination items to render
- When the homepage reaches the destination section
- Then the section does not display a partial or broken grid
- And the page remains visually stable without clipped card edges or stray placeholders

### Section CTA Discipline
- Given a homepage section contains a primary action area
- When the section is rendered
- Then the section exposes at most one primary CTA
- And any additional action is visually secondary
- And the button emphasis remains consistent across light and dark contexts

## REMOVED Behaviors

### Mixed Visual Button Hierarchy
- Buttons that look equally important within the same section are removed because they weaken the page's action hierarchy.

### Opaque Floating Panels Over Photography
- Opaque white floating panels over image-heavy sections are removed because the design system requires real glass surfaces instead.

### Typography Inheritance That Blurs Roles
- Shared or incidental typography styling that makes emotional headlines, labels, and metadata look interchangeable is removed.

## Edge Cases

### Empty Gateway Copy With Action
- Given a gateway panel has no cards available
- When the empty state is shown
- Then the message remains readable and centered
- And the section still provides a clear next action
- And the empty state does not collapse the panel height or break the surrounding spacing

### Empty Guide Panel Copy With Action
- Given the guide panel has no cards available
- When the empty state is shown
- Then the message uses the same visual treatment as the traveler panel empty state
- And the primary action remains available
- And the empty state does not introduce a second primary button

### Dark-Context Contrast Failure Prevention
- Given a dark-background section contains small labels or glass pills
- When the dark-context tokens are applied
- Then labels, borders, and pill text remain readable against the background
- And the page does not fall back to light-context muted colors that wash out on dark imagery

### Narrow Desktop Destinations
- Given the destination grid is rendered on a narrow desktop viewport
- When the available width is not enough for the full multi-column layout
- Then the grid steps down to a simpler arrangement before the right rail becomes clipped
- And the featured destination remains visually dominant without hiding adjacent card text

## Non-Goals

- Route changes outside the homepage gateway and destination surfaces
- New data fetching, state management, or business logic
- Copy rewrites beyond the minimum needed to preserve the intended hierarchy
- Changes to shared UI primitives or unrelated app sections
- Payment, booking, or backend behavior
- A broader redesign of the homepage beyond the requested button, typography, glass-surface, and clipping corrections
