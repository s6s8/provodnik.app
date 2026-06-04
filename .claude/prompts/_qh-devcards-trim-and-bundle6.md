# Task: dev/req-cards playground — trim to 1 bundle + add new prototype bundle 6

## Scope (hard boundary)
Edit ONLY these two files:
- `src/app/dev/req-cards/page.tsx`
- `src/app/dev/req-cards/page.test.tsx`

DO NOT modify the production component `src/components/shared/request-card-final.tsx` or any other file. This is a dev-only playground page (`/dev/req-cards`, noindex). No bash, no git — use only Read/Edit/Write/Glob/Grep. The orchestrator runs all git + verification.

## Background
The page currently renders 5 comparison "bundles" (sections):
1. `badgeVariantSections[0]` "1 · Тихий чип (контроль)"
2. `badgeVariantSections[1]` "2 · Вес: заливка vs контур"
3. `badgeVariantSections[2]` "3 · Вес + силуэт иконки"
4. `ThemeComparisonSection` "4 · Темы: текст vs иконки-only"
5. `OutlineColorSection` "5 · Контур: цвет рамки = тип" — this one renders the PRODUCTION `RequestCardFinal`.

## Required changes

### 1. Delete bundles 1–4, keep bundle 5
Remove sections 1, 2, 3 (the whole `badgeVariantSections` block) and section 4 (`ThemeComparisonSection`). Keep section 5 (`OutlineColorSection`) exactly as-is (it renders `RequestCardFinal`).

Remove all now-dead code that only those four bundles used, so typecheck/lint stay green with zero unused symbols:
- `badgeVariantSections`, `BadgeVariantSection`, `GroupTypeBadgeVariant`
- the local `RequestCard`, `GroupTypeBadge`, `GroupTypeIcon`, `getGroupTypeBadgeClassName`, `AvatarStack`, `getGroupLabel`, `ThemeComparisonSection`
- any badge className consts / imports (`THEMES`, `ThemeIconChip`, `TooltipProvider`, lucide icons, etc.) that become unused after the deletion.

Keep `samples`, `RequestCardSample`, `getInterestThemes`/`themeMap` only if still referenced by what remains; otherwise prune. `OutlineColorSection` currently maps over `samples`, so `samples` stays.

Renumber nothing in the kept bundle 5 — leave its heading "5 · Контур: цвет рамки = тип" as is.

Update the page intro `<p>` text so it no longer describes the removed bundles. Keep it short and accurate: one line saying the page now shows the current production card (bundle 5) and a prototype of the participant-count treatment (bundle 6).

### 2. Add a NEW bundle 6 — prototype: avatars + participant count
Add a new section with heading **"6 · Аватары + счётчик участников"** and a one-line description.

Build a NEW local prototype card component inside `page.tsx` (e.g. `RequestCardCountPrototype`). It must visually match `RequestCardFinal`'s layout (copy its structure): status badge absolutely positioned top-right corner; title (truncate, `pr-24`); date line; row with group-type badge + optional "Гибкие даты" badge; and a bottom `mt-auto` ONE-ROW block: left = participants block + theme icons, right = price (`shrink-0`, pinned right).

The ONLY behavioral difference vs the production card is the participants block on the bottom-left. Implement these rules exactly:
- **1 participant** → render exactly ONE avatar, and NO number.
- **2+ participants** → render a small proof-of-life avatar stack (max 3 overlapping avatars) followed by the joined participant count as a plain number (e.g. `12`, `40`). NO capacity, NO denominator, NO "из N", no "/". Just the count of joined participants.
- The number sits right after the avatars, same row, e.g. small muted-foreground text like `text-sm text-muted-foreground` (match the card's existing typography weight for secondary info).
- Theme icons: max 3, and the theme-icon container must NOT wrap to a second line in this prototype (use `flex-nowrap` / no `flex-wrap`) so card height stays stable even on a busy card.

Add a dedicated demo dataset for bundle 6 (a new local array, do not reuse the 4 `samples` blindly since you need explicit counts). Include at least these cases so Alex can see every rule at a glance:
- **Соло (1 человек):** 1 avatar, no number. (e.g. assembly request just created by author)
- **Малая группа (например 3):** 3 avatars + "3".
- **Большая группа (40 человек):** stack of max 3 avatars + "40" — this proves big groups don't blow up the row.
- One "Гид найден" example and one "Ждёт гида" example across the cards, plus one with `Гибкие даты`, so the corner badge + flexible row coexist with the count.

Each demo case needs: location, date, groupType (private/assembly), guideState, datesFlexible, interests (theme slugs, ≤3), a few avatar members (just 2–3 face objects even when count is 40 — faces are proof-of-life, not the real count), price, and an explicit `participantCount` number.

Render bundle 6 as a responsive grid like the other section (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), each card wrapped in a `TooltipProvider` (theme icons use tooltips), with a short scenario caption above each card describing the case (e.g. "Соло · 1 участник", "Большая группа · 40").

### 3. Rewrite the test file
`page.test.tsx` currently asserts headings 1–5 and counts links/chips for the removed bundles. Rewrite it to match the NEW page:
- Assert bundle 5 heading "5 · Контур: цвет рамки = тип" still renders and its outline-color group chips behave (you may keep the relevant parts of the existing "renders outline-color group type chips" test).
- Add assertions for bundle 6:
  - heading "6 · Аватары + счётчик участников" present.
  - the solo case renders exactly 1 avatar and shows NO count number.
  - a multi-participant case shows its count number (e.g. "40") as text.
  - assert there is no "из" / denominator text anywhere in bundle 6 (no capacity).
- Remove all assertions referencing deleted bundles 1–4.
Keep the `ResizeObserver` mock `beforeAll` (tooltips need it).

## Landmines / conventions
- Tailwind + shadcn/ui only. No custom CSS classes.
- Canonical themes come from `src/data/themes.ts` (`THEMES` / `ThemeSlug`); use existing slugs only — do not invent theme slugs.
- Group labels: private = "Своя группа", assembly = "Открытая". Status: "Ждёт гида" / "Гид найден".
- This is the differentiator vocabulary — never introduce capacity/«вместимость»/«N мест» anywhere; the count is participants-joined only.
- Keep `export const metadata = { robots: { index:false, follow:false } }`.

## DONE report (no commit SHA)
List the two files edited, confirm: bundles 1–4 removed, bundle 5 (RequestCardFinal) intact and untouched, bundle 6 prototype added with the solo/small/large(40) cases, production `request-card-final.tsx` NOT modified, and note any unexpected findings.
