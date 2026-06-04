# Task: req-cards polygon — 3 layout fixes (confirmed by owner)

Single file only: `src/app/dev/req-cards/page.tsx`. Dev polygon (noindex). No other files.

## Hard rules
- No bash. No `git`, no `bun`, no shell. Use only Read / Edit / Write / Glob / Grep. The orchestrator runs all git + verification afterward.
- Tailwind + shadcn only. No custom CSS classes. No new dependencies.
- Keep the existing `RequestCardThemesTopPrototype` component and sample data shape intact — only change the JSX structure / classes described below.

## Confirmed target layout (per card)
```
Line 1:  Город (large, left)  ──────────  Статус гида badge (right)
Line 2:  Группа badge (Открытая / Своя группа) — own row, LEFT-aligned, under city
Line 3:  Дата, время  ·  Гибкие даты (inline, only if datesFlexible)
Line 4-5: Темы chips (icon + label), short labels first, wrap by width
Bottom:  avatars + count (left)  ──────  price (right)
```

## Fix 1 — Group badge moves OUT of the right column, onto its own row under the city
Currently the right column (`div.flex.shrink-0.flex-col.items-end.gap-1.5`) holds BOTH `<GuideStatusBadge>` and `<CountPrototypeGroupTypeBadge>` stacked. 

Change to:
- Line-1 right side holds ONLY `<GuideStatusBadge>`.
- `<CountPrototypeGroupTypeBadge>` becomes its own row directly below line 1, LEFT-aligned (a `div` with `mt-1.5` or similar small gap, left-aligned). It stays inside the `<Link>`, before the date row.

## Fix 2 — City / guide-status alignment on line 1 (do NOT chase the symptom — AP-040)
The misalignment is structural: the city is `text-lg` (line-height 1.75rem ≈ `h-7`) while the guide badge is a short `text-xs py-0.5` pill. With `items-start` the small pill floats above the city's visual text. Earlier vertical-centering of the whole row ("variant B") did not sit.

Correct structural fix: vertically center the guide badge **within the exact height of the city's first text line**. Keep the row at `items-start`. Give the city `leading-7` (so its line box = `h-7` = 1.75rem). Wrap the guide badge in a container that is `flex h-7 items-center` so the small pill is centered against the city's cap height. Result: city baseline and badge read as one clean top line, no float, no extra height.

Apply this only to line 1 (city + guide status). The group badge on line 2 is independent.

## Fix 3 — Themes: short labels first
Currently `interests.slice(0, 3)` → mapped in interest order. Change so the (max 3) theme chips are sorted by label length ascending (short single-word labels like «Еда», «Вино» first; long two-word labels like «История и культура» last) BEFORE rendering. Resolve each slug's label via `getTheme(slug)?.label ?? ""` for the sort key. Keep the wrap behavior (`flex flex-wrap gap-1.5`) — short labels first means short chips pack into the first line and long ones wrap down naturally. Drop slugs whose theme is missing (already handled by `ThemeLabelChip` returning null, but sort must not crash on a missing label).

## Acceptance (orchestrator will verify in browser at 1280 + 375)
- Line 1: city left, guide-status badge right, visually aligned on one top line — no floating pill.
- Group badge sits on its own row under the city, left-aligned. Right column no longer carries it.
- On Тбилиси sample (interests food/history_culture/art): short labels lead; «История и культура» wraps to the second theme row when it doesn't fit.
- Bottom row unchanged: avatars+count left, price right.
- No console errors.

## DONE report
List the exact edits made (structural changes + class changes) and any unexpected findings. Do NOT run git or report a commit SHA.
