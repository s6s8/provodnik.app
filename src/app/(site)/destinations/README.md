# Destination pages

Public destination detail routes at `/destinations/[slug]`. Combine inspiration with live demand and supply: open groups, popular tours, and guides per direction.

## Supported slugs

| Slug | Label | Data mapping |
|------|--------|--------------|
| `altai` | Алтай | Open requests with `destinationLabel: "Altai"` |
| `saint-petersburg` | Санкт-Петербург | Listings/guides in СПб; open requests "Saint Petersburg" |
| `kazan` | Казань | Listings/guides in Казань, Республика Татарстан |
| `suzdal` | Суздаль | Listings/guides in Суздаль, Владимирская область |
| `kaliningrad` | Калининград и побережье | Listings/guides in Калининград, Куршская коса |
| `murmansk` | Мурманск и северный берег | Listings/guides in Мурманск, Мурманская область |

Any other slug returns 404 (`notFound()`). Aggregation uses existing seeds from `open-requests`, `public-listings`, and `public-guides`; no separate `src/data/destinations` module in this worktree (data-layer ownership).

## Validation

- `bun run lint` and `bun run typecheck` must pass.
- Smoke-check: open `/destinations/kazan` (or any slug above).
- Invalid slug (e.g. `/destinations/unknown`) must show 404.
