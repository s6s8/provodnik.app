# Task: add 5th polygon section — colored-outline group type treatment

Workspace: `/Users/idev/provodnik`. This is a dev polygon page only: `src/app/dev/req-cards/page.tsx`. Do NOT touch production cards.

## Context
The page compares treatments for the group-type badge ("Своя группа" / "Сборная"). It already has 4 sections:
1–3. type-marker treatments (quiet / weight / weight+icon)
4. themes text vs icons-only

We agreed on, but never built, one more treatment: distinguish group type by a **colored outline** instead of by fill. Add it as section **5**.

## Hard design invariant (do not break)
Color rule on the card: **fill = guide status** (warm — amber "Ждёт гида" / green "Гид найден", in the badge fill), **outline = group type** (cold). Type chips in this new section must be **outline-only, never filled**, so the two color channels never collide.

## What to build — Section 5: "5 · Контур: цвет рамки = тип"
- Same 4-card matrix (`samples`) as the other sections, same grid layout.
- Both type chips are outline chips (reuse `groupTypeBadgeBaseClassName` + a border; no `bg-*` fill).
- **Своя группа:** neutral grey outline (`border-border`), icon `Users`, text `text-ink-2` — unchanged neutral look.
- **Сборная:** cold outline using the existing `--primary` token — `border-primary/40` (or closest existing utility), icon + text in `text-primary`, silhouette `UsersRound` (the distinct one). Reuse `--primary`; do NOT introduce a new color or hex.
- Keep the chip in the meta row exactly where the others sit. Status badge stays the only warm/filled colored element on the card.

## Implementation notes
- Extend the existing `GroupTypeBadgeVariant` union with a new variant (e.g. `"outline-color"`), and extend `getGroupTypeBadgeClassName` + `GroupTypeIcon` + `GroupTypeBadge` to handle it. For the сборная in this variant, the icon/text color must be primary; for своя, neutral. Keep the existing 3 variants behaving identically.
- Add the section to the page after `ThemeComparisonSection` (or alongside the `badgeVariantSections` map if it fits cleanly — but the per-mode color differs, so a dedicated render is fine). Title: `5 · Контур: цвет рамки = тип`. Description (1 sentence): своя — нейтральный серый контур, сборная — холодный контур цвета primary + силуэт UsersRound; заливку по-прежнему несёт только статус-бейдж.
- Update the intro `<p>` under the h1 to mention the 5th section briefly.
- Add/extend a regression test in `src/app/dev/req-cards/page.test.tsx`: assert the сборная chip in this variant carries the primary border/text class and `UsersRound`, and that своя stays neutral. Follow the existing test style.

## Verify before finishing
Run: `bun run typecheck && bun run lint && bun run test:run && bun run build`. All must be green. Report the test count and confirm the build passed. Do not commit — leave the diff for the operator to review and push.
