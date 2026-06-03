# Task: 4 layout fixes to the req-card prototype (dev playground)

Edit ONLY this file: `src/app/dev/req-cards/page.tsx`
Do NOT touch any other file. Do NOT touch the boevoy component `src/components/shared/req-card.tsx`.

## Hard rules
- No bash, no git, no bun. Use only Read/Edit/Write/Grep/Glob. The orchestrator runs all git + verification.
- Tailwind utility classes only — no custom CSS, no new className constants unless needed.
- Reuse the existing badge/chip className constants already defined at the top of the file.

## Landmine to respect (AP-040 — fix the constraint, not the symptom)
This is a layout-iteration task. Do NOT patch alignment with defensive one-off classes. Restructure the container that allocates space. Specifically: the right-side status area must become a real vertical column, not a hack.

## The component to edit
`RequestCardThemesTopPrototype` (around lines 193-243). Make exactly these 4 changes:

### 1. Right-side becomes a vertical column (status on top, group type directly under it)
Currently the header row has only `<GuideStatusBadge>` on the right, and `<CountPrototypeGroupTypeBadge>` lives down in the date row.
- Change the right-side wrapper from a horizontal `flex items-center` into a vertical column right-aligned:
  - `<div className="flex shrink-0 flex-col items-end gap-1.5">`
  - Inside it, FIRST `<GuideStatusBadge guideState={guideState} />`, THEN `<CountPrototypeGroupTypeBadge groupType={groupType} />`.
- Keep the header row itself as `flex items-start justify-between gap-2` so the city heading top-aligns cleanly with the top badge (status). The city stays `min-w-0 truncate text-lg font-semibold`.
- Result: right column reads top→bottom "guide status" then "group type", both flush to the right edge, directly stacked.

### 2. Remove the group-type badge from the date row
The date row must no longer render `<CountPrototypeGroupTypeBadge>` (it moved to the right column in change 1).

### 3. "Гибкие даты" stays inline on the date row
After removing the group badge, the date row is: date text + (if `datesFlexible`) the "Гибкие даты" trailing badge, in one `flex flex-wrap items-center gap-1.5` row. It must NOT occupy its own line — it trails the date.

### 4. Themes wrap naturally by width (single row container, not a hard 2-per-line split)
Currently themes are split into two fixed blocks: `themeSlugs.slice(0,2)` in one row and `themeSlugs.slice(2)` in a second row. Replace that with ONE `flex flex-wrap gap-1.5` container that maps over ALL `themeSlugs` (still capped at 3 via the existing `interests.slice(0, 3)`). Let flex-wrap decide what fits: short chips sit together, longer two-word chips wrap when they don't fit. Keep `mt-2` on the single container; drop the second `mt-1.5` block entirely.

## Acceptance (orchestrator will verify in browser at 1280 and 375)
- Right side of each card: guide-status badge with the group-type badge directly beneath it, both right-aligned.
- Date row: date + "Гибкие даты" inline (only when flexible); no group badge there; no lone full-width row.
- Themes: natural width-based wrap (e.g. Тбилиси — "Гастрономия" and "Искусство" share a line, "История и культура" wraps because it is long).
- Participant stack + counter at the bottom unchanged; price unchanged.

## DONE report
List the file edited and any unexpected findings. No commit SHA, no shell output.
