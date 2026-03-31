# Design: phase0-hiw-footer-avatars
date: 2026-03-30
stack: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + bun

## Architecture Decision
Use a localized CSS-first refactor inside the existing homepage and shared footer components. The current route tree and shell composition stay intact: `src/app/(home)/page.tsx` still fetches data and hands it to `src/features/homepage/components/homepage-shell.tsx`, which continues to render the gateway, How It Works section, trust block, and footer in the same order. The implementation shifts presentation out of inline styles and into `src/app/globals.css`, so the homepage process block, footer links, and avatar chips all follow the repo's existing "global stylesheet as visual source of truth" pattern without introducing new routes, data contracts, or shared primitives.

## Files to Create
| File | Purpose |
|---|---|
| none | No new files are needed for this change. |

## Files to Modify
| File | What Changes |
|---|---|
| `src/features/homepage/components/homepage-process.tsx` | Rework the current inline-styled 3-step block into the spec-aligned five-step flex presentation, keep the `#hiw` anchor, and remove all inline layout/typography styles in favor of semantic structure plus CSS classes. |
| `src/features/homepage/components/homepage-gateway.tsx` | Keep the existing tabbed request panels, but change avatar rendering so the chips use fixed 28x28 geometry with class-based styling, preserve initials fallback when `avatarUrl` is missing or unusable, and remove the inline image styling. |
| `src/components/shared/site-footer.tsx` | Replace placeholder `#` links with real internal routes or homepage anchors, limit social links to VK and Telegram, and preserve the copyright line text exactly as shipped. |
| `src/app/globals.css` | Add and/or adjust section-specific classes for the homepage process row, connector lines, gateway avatar stack, and footer link states; keep the existing global stylesheet as the single source of visual truth. |

## Files to Delete
| File | Reason |
|---|---|
| none | No deletions are required. |

## Data Flow
1. `src/app/(home)/page.tsx` loads destinations and open requests exactly as it does today.
2. `src/features/homepage/components/homepage-shell.tsx` passes the request list to `HomePageGateway` and renders `HomePageProcess` and `SiteFooter` unchanged in composition.
3. `HomePageGateway` keeps its existing local tab state and renders request cards plus member avatars using class-driven presentation instead of inline styles.
4. `HomePageProcess` renders a static five-step instructional section anchored at `#hiw`; only the markup and classes change.
5. `SiteFooter` renders the same footer areas, but all destinations resolve to real internal navigation targets or the homepage anchor instead of `#`.

## API Changes
No API changes

## Schema Changes
No schema changes

## Component Architecture
`HomePageProcess` stays a presentational homepage section component, but its structure becomes a semantic flex row with five step cards and desktop-only connectors. `HomePageGateway` stays client-side because it already owns the tab toggle state; the only functional change is how avatar chips degrade from image to initials. `SiteFooter` remains a shared chrome component consumed by both the homepage shell and the public site layout, with its link targets corrected but its ownership unchanged. No new reusable primitives are introduced because the change is intentionally narrow and the repo already has the necessary shared shell patterns.

## State Management
No new state changes. `HomePageGateway` keeps its existing local `activeTab` state in the client component; the process section and footer remain stateless. No server state, URL state, or database state changes are introduced.

## Decisions & Rationale
| Decision | Why |
|---|---|
| Keep the current route and shell structure intact | The request is visual and semantic, not navigational; changing routes would add risk without solving the problem. |
| Move presentation into `src/app/globals.css` | This matches the repo's current visual architecture and removes inline styling from the three scoped surfaces. |
| Reuse existing component boundaries | The homepage and footer already have clear ownership, so a localized refactor is lower-risk than extracting new primitives. |
| Preserve client state only in `HomePageGateway` | The tab UI already works as a client interaction and does not need broader state management. |
| Use real links in the footer | Placeholder anchors are broken UX and undermine the public shell's credibility. |

## Risks
- The public footer is shared across the homepage shell and the site layout, so link updates must stay compatible with both render paths.
- The homepage process section currently has only three hard-coded steps; expanding it to five must preserve the existing homepage narrative and spacing on desktop and mobile.
- Avatar fallback behavior depends on the quality of upstream `avatarUrl` data; if URLs are missing or fail to load, the initials presentation must remain visually consistent.
- Global CSS changes can affect other pages that reuse `.avatars`, `.avatar`, or footer selectors, so selector scope needs to stay tight.
