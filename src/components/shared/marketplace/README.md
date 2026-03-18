# Marketplace shared blocks

Reusable UI blocks for **request-first marketplace** surfaces.

## Location

- `src/components/shared/marketplace/*`

## What belongs here

- Presentation-only components that can be reused by multiple public/protected surfaces.
- Built from stable primitives in `src/components/ui/*`.

## Intended consumers

- `/requests` public marketplace (request feed)
- `/requests/[requestId]` public request detail (Phase 2)
- Homepage and listing discovery CTAs where the request-first loop is referenced

## Components

- `MarketplaceHero`: generic marketing hero for marketplace pages.
- `MarketplaceMetricCard`: small stat/metric card for hero right column.
- `MarketplaceFilterPills`: pill-style filter switcher (client).
- `MarketplaceResultsHeader`: "Found N" header with optional right slot.
- `MarketplaceSectionHeader`: section heading row with icon + title/description.
- `MarketplaceNotePill`: subtle rounded pill for small right-side notes.
- `MarketplaceRequestCard`: generic request-style card layout (title/subtitle/badge/meta/highlights/footer slots).

## Notes

- Keep components generic (avoid request-specific data contracts).
- Prefer server components unless the component needs local state/handlers.

