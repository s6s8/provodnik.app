# Homepage "Когда" row — input alignment fix

**Date:** 2026-05-27
**Author:** orchestrator (Claude)
**Scope:** `src/features/homepage/components/homepage-request-form.tsx` lines 153–193
**Status:** approved (Approach A) — pending implementation

## Problem

The "Когда" section of the homepage request form shows three time-related fields in one row: **Дата**, **Начало**, **Конец**. Конец is optional. Two prior attempts to mark it as optional have caused visual misalignment:

1. **Original**: bare date input (no inner label) sat above the labelled time inputs.
2. **Fix attempt 1** (commit `0fd0962`): added a "Дата" label so all three fields had labels. Solved the date-vs-time misalignment.
3. **Fix attempt 2** (commit `264d14a`): folded the optional marker into the label → `"Конец (необязательно)"`. **Regression:** in the narrow ¼-form-width cell that label allocates, the longer text wraps to 2 lines, dropping the Конец input below Начало.

The current attempted fix is a band-aid — it moves the problem from "extra hint pushes box down" to "long label pushes box down".

## Root cause

The layout uses **nested grids**:

```jsx
<div className="grid gap-5 sm:grid-cols-2">     {/* outer: 2 columns */}
  <div className="grid gap-2">                  {/* left half: Дата */}
    ...
  </div>
  <div className="grid grid-cols-2 gap-2">      {/* right half: split again */}
    <div>Начало</div>                           {/* 1/4 of form width */}
    <div>Конец (необязательно)</div>            {/* 1/4 of form width — label wraps */}
  </div>
</div>
```

Each time field gets ~¼ of the form's 672 px container = ~150 px. The text "Конец (необязательно)" at `text-sm` (14 px) is ~147 px — right at the cell boundary, wrapping unpredictably depending on browser font rendering.

The **source** of every alignment regression is that artificially narrow cell. The nested grid pre-allocates 50% of horizontal space to the single date field and forces the two time fields to share the other 50%, even though all three fields carry comparable visual weight.

## Approach — flat 3-column grid

Drop the nested grid. Make Дата / Начало / Конец siblings inside one `sm:grid-cols-3`. Each field gets ~⅓ of the form width (~215 px), comfortably wider than the longest label.

```jsx
<div className="grid gap-2">
  <FieldLabel>Когда</FieldLabel>
  <div className="grid gap-3 sm:grid-cols-3 sm:gap-2 sm:items-end">
    <div className="grid gap-2">
      <FieldLabel htmlFor="startDate">Дата</FieldLabel>
      <Input id="startDate" ... />
      <FieldError ... />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="startTime">Начало</FieldLabel>
      <Input id="startTime" ... />
      <FieldError ... />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="endTime">Конец (необязательно)</FieldLabel>
      <Input id="endTime" ... />
      <FieldError ... />
    </div>
  </div>
</div>
```

### Design choices

| Choice | Reason |
|---|---|
| `sm:grid-cols-3` | Each of 3 fields gets equal width on desktop. Confirmed via Tailwind docs as canonical responsive pattern. |
| `gap-3` mobile / `sm:gap-2` desktop | Vertical stacking on mobile needs more separation; horizontal layout reads tighter. |
| `sm:items-end` | Defensive — if any future label change pushes a row to 2 lines (i18n, asterisk addition, etc.), inputs still align at the row baseline. Documented Tailwind pattern for differing-label-height rows. |
| Optional marker stays in label | Yale/HSBC accessibility guidance: required/optional belongs in the visible label, paired with `aria-required` when applicable. Not in a separate hint that can be visually disconnected. |
| Remove the symptom-fix `FieldHint`/`placeholder="необязательно"` | Single source of truth for "optional" — label only. |

### Out of scope

- No change to validation, schema, or submit logic.
- No change to the rest of the form (Куда / Бюджет / Сколько / Темы / Пожелания).
- No copy change beyond keeping `"Конец (необязательно)"`.
- No semantic change — same three `<input>` elements, same `htmlFor` wiring, same `register()` bindings.

## Research notes

- **Tailwind docs** (`/tailwindlabs/tailwindcss.com`, queried via context7): `sm:grid-cols-N` is the documented breakpoint-prefix pattern; `items-end` is the documented align-items utility for "ensuring text items align with each other, even if they have different heights".
- **NN/g date input UX**: date + start time + end time as three independent fields is a recognised pattern.
- **Yale Dynamic Forms / HSBC Accessibility Hub**: required/optional markers belong inside the `<label>` element, not as siblings. Combining `<label>"Field (optional)"</label>` with `aria-required` (when required) is the WCAG-aligned approach.

## Verification plan

1. `bun run typecheck` — no TS error.
2. `bun run lint:ratchet` — no new warnings.
3. `bun run test:run` — existing `homepage-request-form.test.tsx` still passes (no copy change to assertions other than the Конец label string, which is checked here).
4. Visual check via dev server: mobile (375 px) stacks 3 fields vertically; desktop (≥640 px) shows 3 equal columns with all input boxes on the same baseline.
5. After merge: confirm production at `provodnik.app` renders Конец label on one line and the input aligned with Начало.

## Rollback

`git revert <commit-sha>`. Single-commit change, isolated to one file.
