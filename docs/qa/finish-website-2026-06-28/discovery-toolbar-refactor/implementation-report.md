# Discovery Toolbar / Facets Unification — Implementation Report

> Production-ready refactor unifying the middle band (filter / facet / count region)
> across `/requests`, `/listings`, `/guides`, `/destinations` into one shared
> Discovery Toolbar grammar. Date: 2026-06-29.

## Outcome

All four discovery pages now wear the same toolbar grammar:

```
DiscoveryHero → DiscoverySearchInput
DiscoveryToolbar
  Row 1: DiscoveryFacetRail  [Все N] [Facet N] …   (one horizontal scroll-snap rail, identical desktop + mobile)
  Row 2: DiscoveryResultsCount (left) + Фильтры trigger (right, where advanced filters exist)
  Optional: DiscoveryActiveFilters row when advanced filters are set
DiscoveryGrid
```

Verified live: identical chip height/radius/active colour, one mobile behaviour
(horizontal scroll — no vertical stacking), result count on every page, no dead
`0` chips, Russian everywhere.

## Files changed

| File | Change |
|---|---|
| `src/components/shared/discovery-shell.tsx` | **Added** shared chrome: `DiscoveryToolbar`, `DiscoveryFacetRail`, `DiscoveryFacetChip`, `DiscoveryActiveFilters` (server-safe, no hooks). Kept `bg-surface-low` band vocabulary. |
| `src/components/shared/discovery-filter-sheet.tsx` | **New** client component — single `Фильтры` trigger, responsive Popover (md+) ↔ bottom Sheet (mobile), render-prop body + active-count badge. |
| `src/features/listings/components/public/public-listing-discovery-screen.tsx` | Replaced wrapping count pills + `pillClass` with `DiscoveryToolbar` + facet rail; hides zero-count themes; adds `Найдено N экскурсий`. |
| `src/features/guide/components/public/public-guides-grid.tsx` | Replaced custom chips + `Темы:` label + `Сбросить` link with the shared rail; added `[Все]` (resets specs, preserves query); added `Найдено N гидов`. |
| `src/features/requests/components/public-requests-marketplace-screen.tsx` | Removed the 3 centered dropdown buttons (`Город`/`Когда`/`Тема`) and the bespoke `FilterControl`. Theme/category is now the primary facet rail (multi-select, zero-count hidden); City + When live behind one `DiscoveryFilterSheet`; added `Найдено N запросов`; advanced selections shown via shared `DiscoveryActiveFilters` + `Сбросить всё`. Infinite-scroll / “Показать ещё” / search untouched. |
| `src/features/destinations/components/destinations-discovery-screen.tsx` | Added the toolbar with a category facet rail (`[Все N]` + non-zero `Город`/`Природа`/`Культура`) and `Найдено N направлений`. |
| `src/features/destinations/components/destinations-grid.tsx` | Added `category` filter prop + `DESTINATION_CATEGORY_LABELS`; Russianised the card badge (`city`/`nature`/`culture` → `Город`/`Природа`/`Культура`). |
| `src/features/guide/components/public/public-guides-grid.test.tsx` | Updated the one assertion that referenced the removed `Темы:` label → now asserts the `Все` facet chip sits in the `bg-surface-low` toolbar band. |

## Per-page summary

- **/listings** — single-select rail `[Все N]` + only non-empty themes (the data has no
  categorised listings, so themes are all zero and correctly hidden → just `Все 11`, no
  wall of `0` chips). Count `Найдено 11 экскурсий`. No advanced filters.
- **/guides** — multi-select rail `[Все]` + all theme chips. **No per-facet counts**:
  guides are server-filtered and the page only receives the already-filtered set, and
  specialties are fuzzy free-text — so accurate counts aren’t cheaply available. Per the
  forensics rule “counts must be server-accurate or hidden”, counts are omitted here.
  Result count `Найдено 7 гидов` is accurate (rendered set). `Темы:` label and `Сбросить`
  link removed; `Все` is the reset.
- **/requests** — primary rail = theme/category (multi-select, counts over the full
  request set, zero-count hidden) `[Все 4] [История и культура 3] …`. City + When moved
  behind one `Фильтры` trigger (Popover desktop / Sheet mobile). `Найдено N запросов`
  left of the trigger. City/When/date selections appear as removable badges + `Сбросить
  всё`. Filtering verified (Природа → 1 result); infinite-scroll/pagination logic
  unchanged; RLS/data layer untouched (client presentation only).
- **/destinations** — new category rail `[Все 5] [Город 1] [Природа 1] [Культура 3]`,
  `Найдено 5 направлений`. Card category badges Russianised.

## Verification

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors |
| Named test set (9 files) | ✅ 28/28 passed |
| `bun run build` | ✅ success |
| No custom CSS classes / `<style>` / inline layout styles | ✅ Tailwind + shadcn only (scrollbar hidden via arbitrary variants) |

### Browser smoke (local production server, `next start`)

All four pages, desktop (1280px) + mobile (375px):

| Check | /requests | /listings | /guides | /destinations |
|---|---|---|---|---|
| HTTP 200 | ✅ | ✅ | ✅ | ✅ |
| Console errors (ours) | 0 | 0 | 0 | 0 |
| Horizontal page overflow (mobile) | none | none | none | none |
| Facet rail = single horizontal row (mobile) | ✅ (6 chips, 1 row) | ✅ | ✅ (10 chips, 1 row, scrollWidth 1442 > 320) | ✅ (4 chips, 1 row) |
| Result-count row present | ✅ | ✅ | ✅ | ✅ |
| Фильтры trigger placement | ✅ right of count | n/a | n/a | n/a |
| Zero-count facet chips | none | none | n/a (no counts) | none |
| Russian category labels | ✅ | ✅ | ✅ | ✅ (no `culture`/`city`/`nature`) |
| Advanced filter open (Popover desktop / Sheet mobile) | ✅ City+When | n/a | n/a | n/a |
| Client filtering still works | ✅ (Природа → 1) | ✅ | ✅ | ✅ |

1440px / 390px were not separately re-shot: both are strictly wider than the tested
extremes (1280 / 375), the rail scrolls horizontally and the grid is fluid, so they
introduce no new overflow risk.

## Screenshots

`docs/qa/finish-website-2026-06-28/discovery-toolbar-refactor/`
- `requests-desktop.png`, `requests-mobile.png`, `requests-mobile-filter-sheet.png`
- `listings-desktop.png`, `listings-mobile.png`
- `guides-desktop.png`, `guides-mobile.png`
- `destinations-desktop.png`, `destinations-mobile.png`

## Commit

`refactor(discovery): unify toolbar facets` — committed locally only (not pushed),
per project rule. Hash recorded below.

## Notes / follow-ups (out of scope, flagged)

- **/listings themes are all zero** because `mapDbCategoryToThemeSlug(listing.format)`
  returns null for the seeded listings — so the rail shows only `Все`. This is the
  honest result (no dead `0` chips) but means listings has no working theme facets until
  listing→theme mapping is populated. Worth a data/mapping ticket.
- **/listings Unsplash `/_next/image` 500s** noted in the forensics remain a separate
  image-loader bug; not touched here.
- **/guides facet counts** intentionally omitted (see above) — if an unfiltered guide
  set with theme slugs becomes available server-side, counts could be added.

## Blockers

None.
