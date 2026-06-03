# Task: fix two layout regressions in homepage request form

File: `src/features/homepage/components/homepage-request-form.tsx`

Two visual regressions were introduced by the last form commit. Fix ONLY these two, no other changes.

## Bug 1 — "Гибкая дата" toggle makes the date/time row crooked
The date/time row (comment `{/* 3. Даты и время */}`) is:
`<div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-2">`
The "Дата" column contains the date `<Input>` + `<FieldError>` + the `≈ Гибкая дата` `<Toggle>` stacked vertically. Because the row is `sm:items-end`, the two time columns ("Начало", "Конец") bottom-align to the tall date column, so the time inputs sit lower than the date input — the row looks misaligned/crooked.

Fix so that on `sm:` the three input fields (Дата, Начало, Конец) top-align in one clean row, and the `≈ Гибкая дата` toggle sits neatly BELOW the date input without pushing the time fields down. Recommended approach: change the row to align inputs at the top (e.g. `sm:items-start`) so all three inputs line up, and the toggle naturally hangs under the date column. Verify the toggle no longer overlaps or collides with the date input. Keep the toggle's existing behavior (pressed = `dateFlexibility !== "exact"`).

## Bug 2 — Themes badges are too long/ugly in 2 columns
The Темы block (comment `{/* 7. Темы */}`) renders buttons in:
`<div className="grid grid-cols-2 gap-2">`
This makes each theme chip a full half-width button — long and ugly. Change it back to compact, content-width chips that wrap: use `flex flex-wrap gap-2` instead of the 2-column grid, so each chip is only as wide as its icon + label. Keep each button's existing inner classes, the icon, the selected/unselected styling, the click toggle logic, and the "Ещё темы / Свернуть" button below.

## Constraints
- Touch ONLY `homepage-request-form.tsx`. Do not change copy, terms, schema, or logic.
- Do not rename anything. "Открытая группа" term stays as-is.
- Keep the form working on both 375px and 1280px.

## Verify before done
- `bun run typecheck && bun run lint && bun run test:run`
- Report exactly what classNames changed.
