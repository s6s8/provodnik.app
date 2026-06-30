# Public Audit Fixes — Implementation Report

**Date:** 2026-06-29
**Executor:** Claude Code Opus (bounded execution)
**Branch:** `handover/macmini-final`
**Baseline:** `214e6a7b refactor(discovery): unify toolbar facets`
**Source audit:** `docs/qa/finish-website-2026-06-28/sonnet-full-public-audit/report.md`
**Verification target:** local production build on `http://localhost:3100` (port 3000 was in use by staging dev), Playwright desktop 1280px + mobile 375px.

---

## Summary

All high-impact audit findings that still reproduced after `214e6a7b` are fixed and browser-verified. While fixing H6 I traced a **larger root cause**: `profiles.full_name` is `null` for every guide account (the public name lives on `guide_profiles.display_name`, which is the anon-readable column). This made **every** listing card on `/listings` and every embedded tour card on `/destinations/[slug]` render the role fallback "Локальный гид" instead of the real guide. Fixed at the data layer so all listing surfaces show real names.

---

## Issues fixed (verified)

| ID | Issue | Fix | Verified |
|----|-------|-----|----------|
| H1 | English category tags on destination cards | Already fixed by `214e6a7b` (`DESTINATION_CATEGORY_LABELS`). Confirmed no visible English on catalog **and** detail (only inside RSC payload script). | ✅ |
| H2 | Wrong Russian plurals ("1 гидов") | Applied `pluralize()` in `DestinationCard`, `destination-tile`, `StatStrip`. | ✅ "3 гида", "1 гид", "2 экскурсии", "1 экскурсия" |
| H3 | Tour card titles overflow image bounds | `TourCard` h3 → `line-clamp-2 overflow-hidden`, font `2rem`→`1.5rem`. | ✅ clamped within bounds (desktop + mobile) |
| H4 | Homepage hero time shows AM/PM | Native `<input type=time>` ignores element `lang` in this Chromium (follows browser UI locale). Replaced with a controlled-via-`register` 24h text field (`TimeField` + `formatTime`) — deterministic 24h in every browser. | ✅ shows "10:00 – 12:00"; typing "0815"→"08:15", "9988"→"23:59" (clamped) |
| H5 | Listing detail breadcrumb "Объявления" | → "Экскурсии" in `ExcursionShapeDetail` + `TourShapeDetail`. | ✅ "Экскурсии › Калмыкия › …" |
| H6 | Listing detail guide avatar "ЛГ" | Root cause: `profiles.full_name` null; fall back to `guide_profiles.display_name`. | ✅ avatar "ГО" / "Гиляна Очирова" |
| H7 | Price format "3 тыс. Р" vs "от 3 500 ₽" | `listings-filter` + `guide-profile-screen` tour cards now use `formatRubNumber() + ₽`; destination-detail "бюджет от" stat aligned. | ✅ "от 2 600 ₽" everywhere |
| M7 | "Создать запрос" empty-state button style mismatch | Replaced ad-hoc dark pill with shared `<Button>` (primary). | ✅ matches "Найти гида" |
| M9 | Homepage popular destinations linked to `/listings?q=` | Fetch `getDestinations()`, build name→slug map, link to `/destinations/[slug]` when slug exists (falls back to listings search otherwise). | ✅ tiles → `/destinations/elista` etc. |
| C1 | Request detail cold-load grey hero | `ImmersiveHero` now renders real photos via `next/image` (`priority`) instead of a CSS `background-image`; gradient/data-URL fallback keeps the CSS var path. Next emits a responsive `<link rel=preload as=image>`. | ✅ Moscow hero paints immediately; verified preload link present |

## Bonus root-cause fix (discovered, not in audit list)

- **All listing guide names showed "Локальный гид."** `getActiveListings` joined `profiles.full_name` (null); `getListingsByDestination` didn't join the guide at all. Added `attachGuideDisplayNames()` (batch lookup of `guide_profiles.display_name`) and wired it into both queries. `/listings` now shows Баатр Манджиев, Гиляна Очирова, Санал Бадмаев, … (0 "Локальный гид"); destination tour cards likewise.
- **Destination detail mobile horizontal overflow** (pre-existing). The `Все запросы` section-header link (`shrink-0`) beside a long heading overflowed at 375px (scrollWidth 410). Added `flex-wrap` to the three section headers; desktop stays single-line, mobile no longer overflows (scrollWidth 360).

## Deferred (with rationale)

- **M4** (request detail desktop hero lacks trip summary panel) — audit lists this as "review/recommendation," not a defect; appears intentional. Left as-is.
- **M5** (guide detail mobile duplicate bio) — did **not** reproduce; headline ≠ bio for the audited guide, no duplicate paragraph found. No change.
- **M8** (sparse `/help` content) — content task, explicitly out of scope.
- M2 / M3 / M6 (zero-count chips, chip wrapping) — already fixed by `214e6a7b` per task brief.

---

## Files changed (18)

```
src/app/(home)/page.tsx                                          (M9 slug map)
src/app/(site)/listings/[id]/page.tsx                            (H6 display_name fallback)
src/components/discovery/DestinationCard.tsx                     (H2)
src/components/discovery/StatStrip.tsx                           (H2)
src/components/discovery/__tests__/primitives.test.tsx          (H2 test update)
src/components/listing-detail/ExcursionShapeDetail.tsx           (H5)
src/components/listing-detail/TourShapeDetail.tsx                (H5)
src/components/shared/destination-tile.tsx                       (H2)
src/components/shared/immersive-hero.tsx                         (C1)
src/components/shared/immersive-hero.test.tsx                    (C1 test update)
src/components/shared/tour-card.tsx                              (H3)
src/data/supabase/queries.ts                                     (guide-name enrichment wiring)
src/data/supabase/queries/core.ts                               (attachGuideDisplayNames)
src/features/destinations/components/destination-detail-screen.tsx (H7 stat, M7, mobile overflow)
src/features/destinations/components/listings-filter.tsx         (H7)
src/features/guide/components/public/guide-profile-screen.tsx    (H7)
src/features/homepage-classic/components/homepage-request-form-classic.tsx (H4)
src/features/homepage-classic/components/homepage-shell2-classic.tsx (M9)
```

## Commands run

```
bun run typecheck   # 0 errors
bun run lint        # 0 errors
bun run test:run    # 224 files, 1076 tests passed
bun run build       # success
```

## Screenshots (this directory)

- `01-home-desktop.png` — 24h time, hero
- `05-destinations-desktop.png` — Russian tags + plurals
- `14-destination-detail-desktop.png` — clamped titles, ₽ prices
- `13-guide-detail-desktop.png` — embedded tour cards, ₽ prices
- `12-listing-detail-desktop.png` — "Экскурсии" breadcrumb, "ГО" avatar
- `03-listings-desktop.png` — real guide names (no "Локальный гид")
- `11-request-detail-desktop.png` — Moscow hero (no grey flash)
- `m01-home-mobile.png`, `m12-guide-detail-mobile.png`, `m13-destination-detail-mobile.png` — mobile, no horizontal overflow
</content>
</invoke>
