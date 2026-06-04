# Task: req-cards playground — keep theme icons in section 5 + bottom-anchor the theme strip

File: `src/app/dev/req-cards/page.tsx` (and only this file).

This is the dev comparison page `provodnik.app/dev/req-cards`. Two precise fixes.

## Fix 1 — section 5 must show theme ICONS, not text chips

`OutlineColorSection` (the "5 · Контур: цвет рамки = тип" section) currently renders
`<RequestCard sample={sample} variant="outline-color" />` WITHOUT a `themeDisplay` prop,
so it falls back to `themeDisplay="text"` and themes render as text chips.

Change that call to pass `themeDisplay="icons"` so the chosen icon-only theme treatment
(ThemeIconChip with hover/tap tooltip) is used in section 5 too. Wrap the section's grid in
`<TooltipProvider>` the same way `ThemeComparisonSection` does for its icons block (import is
already present). Section 5 must combine BOTH wins: colored type-outline AND theme icons.

## Fix 2 — theme-icon strip must sit on a constant level above the avatars (do NOT let it jump)

CURRENT STRUCTURE of `RequestCard` (the bug): the card is a `flex h-full flex-col`. The theme
row is placed with `mt-3` right after the badges block, then the footer (avatars + price) is
pushed to the bottom with `mt-auto`. The badges row is `flex-wrap`, so when a card shows 3
badges it wraps to two lines while a 2-badge card stays one line — that pushes the theme row to
a different vertical position card-to-card. On a row of 4 cards the theme icons end up at
different heights = looks like a broken grid.

LANDMINE AP-040 (fix the constraint, not the symptom): do NOT patch this with `min-h`,
`items-end`, or margin tweaks on the theme row. The real fix is the space allocation: anchor the
theme strip to the BOTTOM of the card together with the avatars, so it always sits a fixed gap
above the avatar stack and aligns across all cards (cards are equal height via `h-full`).

RESTRUCTURE: move the theme strip OUT of its current `mt-3` position and INTO a single
bottom-anchored block together with the avatars/price footer. Concretely, replace the separate
theme block + footer with one `mt-auto` group, e.g.:

```tsx
<div className="mt-auto flex flex-col gap-3 pt-4">
  {interestThemes.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {themeDisplay === "icons"
        ? interestThemes.map(({ slug }) => <ThemeIconChip key={slug} slug={slug} />)
        : interestThemes.map(({ slug, label }) => (
            <span key={slug} className="rounded-full bg-surface-low px-2 py-0.5 text-xs text-ink-2">
              {label}
            </span>
          ))}
    </div>
  ) : null}
  <div className="flex items-center justify-between gap-3">
    <AvatarStack members={sample.members} />
    <span className="text-sm font-semibold text-foreground">{sample.price}</span>
  </div>
</div>
```

Result: the badges row stays in the upper flexible region (free to wrap), and the theme strip +
avatars are glued to the bottom at a constant level, aligned across every card in the row.
Keep the existing badge row exactly where it is (inside the `<Link>`); only the theme strip and
footer move into the new `mt-auto` group. Do not change any other section, sample data, badge
logic, or the `ThemeIconChip` component.

## Constraints
- Edit ONLY `src/app/dev/req-cards/page.tsx`. No other files.
- NO shell commands of any kind (no git, no bun). Use only Read/Edit/Write/Glob/Grep.
- No custom CSS classes — tailwind utility classes only (project rule).
- The orchestrator runs all typecheck/lint/build/git after you finish.

## DONE report
List the exact edits made (which functions changed) and any unexpected findings. Do not run or
report any commands.
