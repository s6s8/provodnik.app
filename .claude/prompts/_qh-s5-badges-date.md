# Task: polygon section 5 (req-cards) — three small UI fixes

Scope: ONLY the dev polygon page `src/app/dev/req-cards/page.tsx`, the **section 5 / "outline-color" variant** (the colored-outline group-type treatment). Do not touch production components. Keep tailwind + shadcn only, no custom CSS classes.

## Fix 1 — status badge: icon goes AFTER the text
Component `GuideStatusBadge` currently renders the icon BEFORE the label:
```
<Check size={14} className="text-success" /> Гид найден
<Hand size={14} className="text-warning" /> Ждёт гида
```
Move the icon to the RIGHT of the text, so the word starts flush at the badge's left edge:
```
Гид найден <Check size={14} className="text-success" />
Ждёт гида <Hand size={14} className="text-warning" />
```
Keep `inline-flex items-center gap-1` so spacing stays correct.

## Fix 2 — Сванетия mock date: single date, not a range
In the sample data array, the "Сванетия" entry has:
```
date: "14–16 августа, 09:00",
```
Change it to a single date:
```
date: "14 августа, 09:00",
```
Only that one entry. Do not change other cards.

## Fix 3 — equalize people-icon visual size in group-type badges
In `GroupTypeIcon`, the "Сборная" (assembly) badge uses `UsersRound` while "Своя группа" (private) uses `Users`. Both are `size={14}` but `UsersRound` renders visually larger/heavier, so they look mismatched. Make the two people icons visually the same size. Preferred approach: use the SAME glyph for both group types in the outline-color variant (e.g. `Users` for both), since the colour already distinguishes them. If you keep distinct glyphs, instead tune the sizes so they read as equal weight. Goal: the two badges' people icons look identical in size; colour remains the only distinguisher.

## Verify
- `bun run typecheck && bun run lint`
- Confirm the dev polygon page still renders.
- Report the git diff.
