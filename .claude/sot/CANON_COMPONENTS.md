# CANON_COMPONENTS.md — canonical component & helper registry

_One concept → one canonical implementation. Before creating ANY component, hook, or formatting
helper: find your concept here; if it exists, import it; if it doesn't, grep for a sibling first
(`rg -il "<concept>" src/components src/features`). Creating a parallel implementation of anything
in this table is a defect, not a style choice. Enforced mechanically by `bun run lint:canon`
(pattern bans) and `bun run lint:dead` (zero-importer components). Source evidence:
`docs/COMPONENT_AUDIT.md` (2026-07-06)._

## Formatting & logic helpers

| Concept | Canonical | Never |
|---|---|---|
| Money (₽, kopecks) | `formatRub` / `formatRubFromMinor` / `formatRubNumber`, `rubToKopecks` / `kopecksToRub` — `src/data/money.ts` | local `Intl.NumberFormat`, inline `* 100` / `/ 100` (AP-012) |
| Dates (RU, Moscow-pinned) | `formatRussianDate*`, `formatRussianDateRange`, `todayMoscowISODate`, `formatDurationMinutes` — `src/lib/dates.ts` | local `toLocaleDateString` / `Intl.DateTimeFormat` (AP-010) |
| Russian plurals | `pluralize(n, one, few, many)`, `pluralizePeopleGenitive` — `src/lib/utils.ts` | inline `n === 1 ? … : n < 5 ? …` ternaries (wrong at 21, 111) |
| className merge | `cn` — `src/lib/utils.ts` | manual template-literal concatenation where conditionals conflict |
| Server-action envelope | `createAction` — `src/lib/actions/create-action.ts`; result shape `{ ok: boolean; error?: string; data?: T }` | new `{ success: … }` dialects, inline auth-guard copies |
| searchParams first value | `firstParam` — `src/lib/utils.ts` (planned, audit W1; until then inline once, don't copy) | — |

## UI components

| Concept | Canonical | Notes |
|---|---|---|
| Buttons/inputs/selects/textareas/dialogs/tabs | `src/components/ui/*` (shadcn) | raw `<select>`/`<textarea>` outside `ui/` blocked by lint:canon; `ui/button` has 103 importers — it covers your case |
| Page h1 header | `src/components/shared/page-header.tsx` | 31 importers — the adopted canon |
| Empty state | `src/components/shared/empty-state.tsx` (live, 16 importers) | audit W3 merges it into `ui/empty-state.tsx`; either way — never inline a new one |
| Loading skeletons | `src/components/ui/skeleton.tsx` + `src/components/shared/loading-skeletons.tsx` (`CardGridSkeleton`, `DetailSkeleton`, `ListRowSkeleton`) | never hand-paste `animate-pulse` div stacks in `loading.tsx` |
| Confirm dialog | `ConfirmDialog` / `useConfirm` — `src/components/shared/confirm-dialog.tsx` | `window.confirm` blocked by lint:canon |
| Glass panel | `GlassCard` — `src/components/shared/glass-card.tsx` | raw glass class string blocked by lint:canon |
| Page container | planned `PageContainer` (audit W3); until it exists, the clamp string is frozen — new files must not inline it | lint:canon |
| Status badge (booking) | `BookingStatusBadge` + `BOOKING_STATUS_LABELS` — `src/components/bookings/booking-status-badge.tsx` | audit W2 replaces all status maps with one `StatusBadge` + registry; meanwhile: reuse `BOOKING_STATUS_LABELS`, never re-declare labels |
| Group-type / date-flex badges | locals in `request-card-final.tsx:74-121` are the reference look; audit W2 promotes them to `shared/request-badges.tsx` | never invent a new color scheme — MVP canon requires identical badges on ALL card levels |
| Interest/theme chip | `InterestTag` — `src/components/shared/interest-tag.tsx` | |
| Rating stars (display) | `RatingDisplay` — `src/components/shared/rating-display.tsx` | input variant is `StarRatingInput` (reviews) — separate on purpose |
| Avatar | `src/components/ui/avatar.tsx`; stacks: `src/components/ui/avatar-stack.tsx` | `shared/avatar-stack.tsx` is a fork slated for deletion (W3) — don't add users |
| Search input (discovery) | `src/components/shared/discovery-search-input.tsx` | |
| List row | `src/components/shared/list-row.tsx` | |

## Where components live

- `src/components/ui/` — generic primitives (shadcn-style, cva variants). Stable; don't modify casually.
- `src/components/shared/` — cross-domain composed components (used by 2+ features).
- `src/features/<domain>/components/` — domain-owned screens/components (used by one feature).
- Promotion rule: second feature needs it → move to `shared/` (git mv, update imports). Never copy.

## Maintenance

When audit waves W1–W6 (docs/COMPONENT_AUDIT.md §6) land, update the two "planned" rows above and
shrink the lint-canon allowlists / lint-dead baseline in the same commit. New canonical helpers
added to the codebase get a row here in the same PR.
