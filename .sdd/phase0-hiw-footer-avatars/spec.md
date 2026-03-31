# Spec: phase0-hiw-footer-avatars
date: 2026-03-30
based-on: proposal.md (Option A)

## ADDED Behaviors

### Five-Step How It Works Flow
- Given the homepage is loaded on a wide viewport
- When the user reaches the How It Works section
- Then they see five distinct steps presented as one continuous marketplace flow
- And the steps read in order from first to last with visual connectors between adjacent steps
- And the connectors are hidden when the layout collapses for narrow viewports

### Avatar Chip Fallback Rendering
- Given a gateway request includes participant avatars
- When an avatar image is available and usable
- Then the chip shows the image in a compact circular avatar
- And when an image is missing or fails to load, the chip shows the participant initials instead of a broken image or empty frame
- And the gateway still renders a stable overlapping avatar stack

### Valid Footer Destinations
- Given the footer is displayed on the public site
- When a user activates any footer link or social link
- Then each destination resolves to a live in-app page, a homepage section anchor, or one of the supported social profiles
- And the footer does not expose placeholder destinations

## MODIFIED Behaviors

### How It Works Section Presentation
**Before:** The section presents a shorter step flow with ad hoc presentation treatment.
**After:** The section presents a five-step visual flow that matches the site's editorial marketplace pattern.

- Given the homepage is rendered
- When the How It Works section appears
- Then the section shows the full five-step journey from request creation through trip completion
- And the section remains readable and balanced across viewport sizes

### Footer Link Set and Socials
**Before:** Some footer items point to placeholder destinations and the social area is not constrained to the approved networks.
**After:** Footer navigation is limited to live destinations, and the social area contains only VK and Telegram.

- Given the footer is visible
- When a user reviews the navigation groups
- Then every visible link has a meaningful destination
- And the social area includes only VK and Telegram
- And no unsupported social network links are shown
- And the copyright statement remains the current 2026 Provodnik rights line

### Gateway Participant Avatars
**Before:** The gateway participant stack can expose broken image rendering when an avatar URL is unusable.
**After:** Each participant chip always degrades to a valid visual representation.

- Given the gateway shows participant chips
- When an avatar URL is unavailable or invalid
- Then the chip still renders with a stable size and shape
- And the participant remains identifiable through initials or another non-broken fallback
- And the stack keeps its compact overlapping presentation

## REMOVED Behaviors

### Placeholder Footer Destinations
- Dead placeholder footer targets are removed so the footer no longer suggests unavailable pages or networks.

### Shorter How It Works Flow
- The previous shorter flow is replaced by the five-step marketplace journey.

## Edge Cases

### Empty Gateway Data
- Given the homepage gateway has no requests to show
- When the section renders
- Then the page still displays a usable empty state
- And no broken avatar stack or layout collapse appears

### Avatar Load Failure
- Given a participant avatar initially appears usable
- When the image request fails during rendering
- Then the chip falls back to initials without changing the surrounding layout

### Narrow Viewport Presentation
- Given the homepage is viewed on a narrow screen
- When the How It Works section renders
- Then the step order remains intact
- And the connectors are not shown if they would reduce clarity in the stacked layout

### Unsupported Footer Target
- Given a footer destination is not available as a live target
- When the footer is evaluated for display
- Then the unavailable target is not presented as a clickable placeholder

## Non-Goals

- Do not change route structure or introduce new pages.
- Do not change the marketplace data model or request generation logic.
- Do not add new social networks beyond VK and Telegram.
- Do not alter protected-area behavior or booking flow logic.
- Do not introduce new component abstractions or shared primitives.
- Do not change the homepage brand direction outside the scoped visual/content updates.
