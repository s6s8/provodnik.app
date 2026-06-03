# Task: collapse request-card bottom block into one row

File: `src/components/shared/request-card-final.tsx`

## Goal
The bottom block of the request card currently renders as TWO rows:
- row 1: theme icon chips
- row 2: avatar stack (left) + price (right)

Collapse them into ONE single row to reduce card height by one line:
- LEFT side: avatar stack, then theme icon chips, in the same row.
- RIGHT side: price, always pinned to the far right.

Keep the avatar stack exactly as it is now (do NOT remove or change avatars).

## Current code (lines ~128-142)
```tsx
<div className="mt-auto flex flex-col gap-3 pt-4">
  {themeSlugs.length > 0 ? (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {themeSlugs.map((slug) => (
          <ThemeIconChip key={slug} slug={slug} />
        ))}
      </div>
    </TooltipProvider>
  ) : null}
  <div className="flex items-center justify-between gap-3">
    <AvatarStack members={members} />
    <span className="text-sm font-semibold text-foreground">{price}</span>
  </div>
</div>
```

## Target behavior
- One row: `justify-between`, with a left group (avatars + theme chips) and the price on the right.
- Price (`<span>`) must always stay pinned to the right and never wrap or shrink — keep it `whitespace-nowrap` / `shrink-0`.
- The left group (avatars + theme chips) gets the remaining width; on narrow widths (375px) the theme chips may wrap within the left group, but the price stays in place on the first row. Use `min-w-0` on the left group so it can shrink and the price never gets pushed off.
- Keep the `TooltipProvider` wrapper around the theme chips.
- Keep vertical rhythm: the row should sit at `mt-auto pt-4` like before. Since it's now a single row, drop the outer `flex-col gap-3` wrapper and make the single row the `mt-auto pt-4` element.
- If `themeSlugs.length === 0`, render only avatars (left) + price (right), same as before but in the single row.
- Keep `items-center` alignment.

## Constraints
- No custom CSS classes; tailwind + shadcn/ui only.
- Do not touch any other component, props, or the test file logic beyond what's needed.
- Do not change avatars, badges, header, or guide-status corner badge.

## Verify
Run: `bun run typecheck && bun run lint && bun run test:run`
Existing tests in `request-card-final.test.tsx` must stay green. If a test asserts on the two-row DOM structure, adjust the assertion to match the new single-row structure WITHOUT weakening coverage (still assert avatars, theme chips, and price all render).

Report: exact diff summary (files + line ranges), and confirm typecheck/lint/test results with the test count.
