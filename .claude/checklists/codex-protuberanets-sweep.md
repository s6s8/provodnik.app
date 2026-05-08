# Cards typography compliance — sweep checklist

> Tracks compliance of card-shaped surfaces against the spec at `_archive/bek-frozen-2026-05-08/specs/cards-typography.md`.
>
> Filename is legacy — was created on 2026-05-01 under the wrong assumption that the typography numbers were part of Кодекс «Протуберанец». Кодекс is a behavioural code (see `.claude/checklists/discipline-traps.md` and Кодекс entries themselves), not a UI spec. The UI spec lives at `_archive/bek-frozen-2026-05-08/specs/cards-typography.md`.

## Spec (canonical reference)

See `_archive/bek-frozen-2026-05-08/specs/cards-typography.md`. Short form:
- Desktop padding `px-6 py-5` (24×20). Mobile `p-4` (16×16). Tailwind: `p-4 md:px-6 md:py-5`.
- Vertical gaps ≥12px (`gap-3`).
- Line-height ≥1.5 body / ≥1.3 heading.
- Card grows; text doesn't shrink.

## Surfaces (status as of 2026-05-01)

| # | Surface | File | Status | Plan that fixes |
|---|---------|------|--------|-----------------|
| 1 | Homepage discovery — request card | `src/features/homepage/components/homepage-discovery.tsx` | **compliant 2026-05-03** (p-4 md:px-6 md:py-5, gap-3) | Plan 51 T1 shipped |
| 2 | Homepage discovery — empty placeholder | same file | **compliant 2026-05-03** (p-4 md:px-6 md:py-5, gap-3) | Plan 51 T3 shipped |
| 3 | Homepage form — mode selector cards | `src/features/homepage/components/homepage-request-form.tsx` (or sibling) | unknown — not audited | next plan touching homepage |
| 4 | Public listings grid — listing card | `src/features/listings/components/public/*` | unknown — not audited | next plan touching /listings |
| 5 | Public guides grid — guide card | `src/features/guide/components/public/public-guide-card.tsx` | **compliant 2026-05-03** (p-4 uniform; compact horizontal layout, not block card) | Plan 47 T1 verified |
| 6 | Listing detail — Excursion shape | `src/components/listing-detail/ExcursionShapeDetail.tsx` | unknown — not audited | next plan touching /listings/[slug] |
| 7 | Listing detail — Tour shape | `src/components/listing-detail/TourShapeDetail.tsx` | unknown — not audited | same as above |
| 8 | Traveler request — active card | `src/features/traveler/components/requests/active-request-card.tsx` | unknown — not audited | next plan touching traveler cabinet |
| 9 | Traveler request — confirmed booking | `src/features/traveler/components/requests/confirmed-booking-card.tsx` | unknown — not audited | same as above |
| 10 | Traveler request — offer card | `src/features/traveler/components/requests/offer-card.tsx` | unknown — not audited | same as above |
| 11 | Guide inbox — request card | `src/features/guide/components/requests/*` | unknown — not audited | Plan 50 T3 (already touches the inbox) — verify |
| 12 | Guide bid form panel | `src/features/guide/components/requests/bid-form-panel.tsx` | unknown — not audited | next plan touching guide cabinet |
| 13 | Guide listing card (cabinet) | `src/features/guide/components/listings/*` | unknown — not audited | same as above |

## How to use this file

When a plan is dispatched, look at this list and:
1. If the plan touches one or more surfaces in the table, append a verification step to the plan: "verify against the cards typography spec at `_archive/bek-frozen-2026-05-08/specs/cards-typography.md`; update sweep row(s) X to compliant or VIOLATES with details."
2. After the plan ships, update the row(s) it touched.
3. If a plan visits a surface marked `unknown` and finds it compliant, mark it `compliant` with the audit date. If it finds a violation that the plan can't fix in scope, mark it `VIOLATES` and queue a sweep task.

Goal: every row reads `compliant` or has a named plan number under "Plan that fixes" before launch.

## Triggers to reopen this file

- A new measurable rule is added to `_archive/bek-frozen-2026-05-08/specs/cards-typography.md` — recheck every row.
- A new card-shaped surface is added anywhere in `src/` — append a row.
- A complaint about typography/padding lands — verify the named surface's row matches reality.
