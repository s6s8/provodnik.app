# Spec: phase0-nav-hero
date: 2026-03-30
based-on: proposal.md (Option A)

## ADDED Behaviors
New homepage-first behaviors introduced by this change.

### Home Layout Header Clearance
- Given a visitor opens the homepage with the floating header rendered at the top of the viewport
- When the first screen loads on desktop, tablet, or mobile
- Then the homepage content starts below the fixed header instead of sitting underneath it
- And the hero remains visually aligned with the floating navigation treatment rather than appearing clipped by it

### Hero Surface Token Override
- Given the homepage hero is rendered on top of a darkened photographic background
- When the hero headline, supporting copy, and calls to action are displayed
- Then the hero uses a dark-surface text treatment that preserves readable contrast for headline, body, and secondary action text
- And that contrast treatment is scoped to the hero presentation rather than changing the rest of the homepage sections

## MODIFIED Behaviors
Existing homepage and shared-header behaviors that change in this release.

### Primary Site Navigation
**Before:** The fixed header shows four center navigation links, including legacy homepage and requests entries, with a broader glass treatment that does not match the validated design system.
**After:** The fixed header uses the validated pill navigation with the Provodnik wordmark, three center links, a ghost sign-in action, and a primary create-request action.

- Given a visitor sees the public site header on the homepage or other public pages
- When the header renders
- Then the center navigation offers exactly the validated three destinations: destinations, guides, and how-it-works
- And the right side offers a secondary sign-in action and a primary create-request action
- And the current page link keeps the active-state emphasis with the primary-colored label and dot indicator

### Mobile Navigation Compression
**Before:** The shared header keeps the old information architecture and only partially adapts it for smaller screens.
**After:** The mobile header collapses to the validated compact pattern.

- Given a visitor views the public site on a mobile-width viewport
- When the fixed header renders
- Then the center navigation links are hidden
- And the ghost sign-in action is hidden
- And the wordmark plus primary create-request action remain visible and tappable

### Homepage Hero Composition
**Before:** The homepage hero is a centered search-led banner with inline styling, an older image, a heavier overlay, and two secondary text links below the search form.
**After:** The homepage hero follows the validated cinematic composition, uses class-based styling, switches to the specified image and lighter directional overlay, and restores the validated CTA hierarchy.

- Given a visitor lands on the homepage
- When the hero is displayed
- Then the hero presents the validated photographic scene and lighter directional overlay from the design source of truth
- And the hero copy follows the approved kicker, headline, and supporting hierarchy for the first screen
- And the primary action is create-request
- And the secondary navigation action is find-group styled as a navigation link rather than a competing primary action

### Homepage Hero Interaction Pattern
**Before:** The first screen prioritizes a destination search form inside a glass search bar.
**After:** The first screen prioritizes the validated action hierarchy instead of a search-first interaction.

- Given a visitor reaches the homepage hero
- When they scan the available actions
- Then the hero exposes the approved primary and secondary calls to action for creating a request or navigating to group discovery
- And it does not require an inline destination search field to access the main hero action

### Homepage Hero Glass Treatments
**Before:** The hero mixes inline glass values and dark-surface text utilities in a way that drifts from the validated design tokens.
**After:** The hero and header use the approved glass and overlay treatments defined by the design system.

- Given the homepage header and hero are rendered over photography
- When their floating surfaces appear
- Then they use the validated frosted-glass appearance, blur, border, and elevation treatment expected for floating UI
- And the hero kicker pill remains legible without becoming a heavy opaque badge

## REMOVED Behaviors
Behaviors intentionally removed from the current experience.

### Search-First Hero Form
- The homepage hero no longer leads with an inline destination search form because the validated design for this screen is action-led, not search-led.

### Legacy Navigation Information Architecture
- The shared public header no longer exposes the old four-link set that included homepage and requests because the validated design standardizes the public navigation to three center links plus two right-rail actions.

## Edge Cases
Behavior for constrained states and transitions.

### Missing Homepage Data
- Given destination or request data is unavailable and the homepage falls back to empty arrays
- When the homepage renders
- Then the updated header and hero still render normally
- And the first-screen navigation and calls to action remain usable without any backend data

### Header Across Public Routes
- Given a visitor navigates between public pages that reuse the shared header
- When the destination, guides, or how-it-works route is active
- Then only the matching nav item is marked active
- And non-matching links do not show the active dot treatment

### Small Viewport Hero Readability
- Given a visitor opens the homepage on a narrow mobile viewport
- When the hero text and actions wrap to fit the screen
- Then the overlay, spacing, and text treatment still preserve readable copy and tappable actions
- And the hero does not rely on hidden desktop-only controls to complete its primary path

### Local Environment Without Supabase Configuration
- Given the app is running locally without Supabase credentials
- When a visitor loads the homepage shell
- Then the visual header, hero, and spacing changes still render
- And the absence of backend configuration does not block the first-screen layout or CTAs

## Non-Goals
- Changing routes, destinations, or backend behavior beyond the existing link targets used by the header and hero
- Redesigning sections below the homepage hero, the site footer, or other public-page layouts
- Changing shared UI primitive components outside the existing shared header and homepage presentation layer
- Adding new booking, auth, search, or Supabase functionality
- Broad CSS cleanup unrelated to the navbar, homepage hero, or homepage header offset
