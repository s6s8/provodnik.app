# Task: ship the final request-card design (dev/req-cards Section 5) into production on `/` and `/requests`

## Goal
Promote the **Section 5** request-card design from the dev polygon into a real shared production component, and render it in **two** places:
1. Homepage `/` — block "Что ищут путешественники прямо сейчас".
2. `/requests` — page "Открытые запросы на экскурсию".

This is a **visual upgrade only**. Do NOT change data models, DB, schemas, or business logic. Map the card's fields onto the REAL data each page already has.

## Source of truth for the design
`src/app/dev/req-cards/page.tsx` — function `OutlineColorSection()` + the inline `RequestCard` rendered with `variant="outline-color"` and `themeDisplay="icons"`. Supporting chip: `src/app/dev/req-cards/theme-icon-chip.tsx` (`ThemeIconChip`).

Final card shows:
- Status badge "Ждёт гида" (amber, Hand icon to the RIGHT of text) / "Гид найден" (green, Check icon to the right).
- Group-type badge by **outline color only**: "Своя группа" = neutral gray border; "Сборная" = cold `primary/40` border. NO "X из Y", NO numeric capacity, NO progress bar, NO fill-percentage coloring.
- Optional "Гибкие даты" pill when dates are flexible.
- Theme/interest chips = **icon-only** with hover/tap tooltip (`ThemeIconChip`).
- People = equal-size avatar stack (size-6), price to the right.
- Single date string (do NOT invent a second date).

## What to build
1. Extract the Section-5 card into a real shared component, e.g. `src/components/shared/request-card-final.tsx` (pick a name consistent with repo conventions), plus move `ThemeIconChip` to a shared location (e.g. `src/components/shared/theme-icon-chip.tsx`). The component must be reusable by both pages with different source data — give it clean typed props (location, date, groupType: "private" | "assembly", guideState: "waiting" | "found", datesFlexible, interests as theme slugs, members/avatars, price, href).
2. Wire it into `/requests` — `src/features/requests/components/public-requests-marketplace-screen.tsx` (currently uses `ReqCard`). Map `OpenRequestRecord` fields onto the new card.
3. Wire it into the homepage — `src/features/homepage/components/homepage-discovery.tsx` (currently custom inline markup). Map `RequestRecord` fields onto the new card, replacing the custom card markup. Keep the section heading, the empty-state ("Пока пусто"), and the grid wrapper.
4. Keep `/dev/req-cards` Section 5 visually IDENTICAL — ideally have the dev page import the new shared component so the polygon and prod stay in parity; if that risks breaking other dev sections, leave the dev page as-is but ensure prod matches it pixel-for-pixel.

## Data mapping — investigate the REAL fields, do NOT invent
The two pages use DIFFERENT data types. Inspect them before mapping:
- `/requests`: `OpenRequestRecord` from `src/data/open-requests/types.ts` — has `destinationLabel`, `dateRangeLabel`, `highlights[]`, `interests[]`, `group` (`openToMoreMembers`, `sizeCurrent`, `sizeTarget`), `members[]`, `budgetPerPersonRub`.
- `/`: `RequestRecord` from `src/data/supabase/queries.ts` — has `destination`, `dateLabel`, `startTime/endTime`, `mode`, `date_locked`, `interests[]`, `budgetRub`, `offerCount`. Check whether it has members/avatars and any guide-assigned field.

For each card field, find the real source:
- **group type (private/assembly):** `/requests` → derive from `group.openToMoreMembers` (true = "Сборная"/assembly, false = "Своя"/private) unless a clearer explicit mode field exists; `/` → `req.mode === "assembly"`. Confirm by reading the types.
- **guideState (waiting/found):** Find the real field that indicates a guide has been assigned/accepted an offer. Search the data layer. If `OpenRequestRecord`/`RequestRecord` genuinely has no such field, derive the most defensible signal (and clearly flag it in your report) — do NOT fabricate "Гид найден" with no backing. If there is truly no signal, default to "Ждёт гида" and FLAG that the found-state is not yet wired.
- **interests → theme chips:** The card uses `@/data/themes` `ThemeSlug` + `ThemeIconChip` (icons). The request data `interests` map to `@/data/interests` `INTEREST_CHIPS` labels. Reconcile the two taxonomies: build a correct slug→theme mapping. If some interest slugs have no matching theme/icon, fall back gracefully (skip or text) and FLAG the unmapped ones. Do NOT silently drop interests without noting it.
- **members/avatars:** `/requests` has `members`. If the homepage `RequestRecord` has no members, render the avatar row gracefully (omit it or show a sensible fallback) and FLAG it — do not invent fake avatars.
- **date:** single label only (`dateRangeLabel` / `dateLabel`). Never synthesize a second date.
- **price:** reuse existing derive helpers (`derivePrice`, `budgetRub` formatting). Keep "По договоренности" fallback behavior.

## Hard constraints
- Do NOT touch `/destinations/<slug>` (`src/features/destinations/components/destination-detail-screen.tsx`) or the existing `ReqCard` (`src/components/shared/req-card.tsx`). Leave that block exactly as-is (it stays hidden). Create a NEW component so nothing bleeds into destinations.
- No new DB fields, no migrations, no schema changes, no business-logic changes. Visual/presentational only.
- No custom CSS classes — tailwind + shadcn/ui only (project rule).
- Package manager is `bun` (never npm/yarn).
- Do NOT remove the "скрытый максимум людей в группе" logic — that is a SEPARATE future task. Here you only stop DISPLAYING capacity in the new card; leave the underlying fields/queries untouched.

## Verification (run and report results)
- `bun run typecheck`
- `bun run lint`
- `bun run test:run` (update any snapshots/unit tests that referenced the old card; do not weaken assertions to pass)
- `bun run build`
- If feasible, run the app and confirm `/` and `/requests` render the new card; capture how it looks at 1280px and 375px.

## Report back (acceptance report)
- Files created / modified (and confirm `/destinations` + old `ReqCard` untouched via diff).
- The exact field mapping used for each card field on each page.
- Every place you had to FLAG (missing guide-found signal, missing homepage avatars, unmapped interest slugs, etc.) with what fallback you chose.
- Check results: typecheck / lint / tests / build (paste real output).
- Any risks or follow-ups.

Commit when green (do not push). End the commit message with the project's standard co-author trailer.
