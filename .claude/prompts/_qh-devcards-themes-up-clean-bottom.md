# Task: rebuild /dev/req-cards playground — one new bundle

Scope: ONLY these two files. Do not touch the production card component or anything else.
- `src/app/dev/req-cards/page.tsx`
- `src/app/dev/req-cards/page.test.tsx`

This is a playground/prototype page (noindex). It currently has two bundles:
- Bundle 5 "Контур: цвет рамки = тип" (`OutlineColorSection`, renders `RequestCardFinal`)
- Bundle 6 "Аватары + счётчик участников" (`CountPrototypeSection`, renders `RequestCardCountPrototype`)

## What to do

1. **Delete both bundle 5 and bundle 6 entirely** — remove `OutlineColorSection`, `CountPrototypeSection`, and any code/imports used only by them (e.g. `RequestCardFinal` import, the `samples` array if unused).

2. **Build ONE new bundle** that demonstrates this layout for a request card. Title it:
   `1 · Темы наверху, чистый низ`
   Subtitle: `Темы — подписанные чипы в верхнем ряду меток (значок + слово). Нижняя строка только «кто идёт» и цена.`

### New card layout (prototype component, inline in this page)

Top (inside the `<Link>` block, same as today):
- Location (large, semibold), truncated.
- Date (muted, small).
- A **wrapping** label row (`flex flex-wrap gap-1.5`) containing, in order:
  1. Group-type badge — `Открытая` (assembly) or `Своя группа` (private) with `Users` icon. Assembly = primary outline (`border border-primary/40 text-primary`, icon `text-primary`); private = neutral outline (`border border-border text-ink-2`, icon `text-ink-2`). Reuse the existing badge class constants.
  2. `Гибкие даты` badge when `datesFlexible` is true (existing `datesFlexibleBadgeClassName`).
  3. **Theme label chips** — one per theme slug (max 3). Each chip is **icon + Russian word** (NOT a bare icon). Build a small inline `ThemeLabelChip` component in this page using `getTheme(slug)` from `@/data/themes` to get `label` and `Icon`. Style it like the neutral group badge: `inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-2`, with `<Icon size={14} className="text-ink-2" aria-hidden="true" />` then the label text. Do NOT use the existing icon-only `ThemeIconChip` here.

Status badge stays in the top-right corner (`GuideStatusBadge`, keep as-is).

Bottom row (`mt-auto flex items-center justify-between gap-3 pt-4`):
- **Left:** participant stack only — keep the existing `ParticipantStack` behaviour: 1 participant = a single avatar with **no number**; 2+ = up to 3 overlapped avatars + the actual `participantCount` number (no capacity, no "из", no "/"). Keep `data-testid="participant-avatar"`.
- **Right:** price (`shrink-0 whitespace-nowrap text-sm font-semibold`).
- **No theme chips at the bottom** — themes now live only in the top label row.

Use the existing `countPrototypeSamples` (4 scenarios: solo/1, small/3, large/40, private/2) as the data for this bundle — they have `participantCount`. Keep all 4 cards rendered in the same responsive grid as before (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).

3. **Update the page intro paragraph** under the `<h1>` to describe the single new bundle (drop the "bundle 5 / bundle 6" wording).

4. **Rewrite `page.test.tsx`** to match the new single bundle:
   - Assert the new heading `1 · Темы наверху, чистый низ` renders.
   - Assert the old headings ("5 · …", "6 · …") are gone.
   - Assert theme **words** appear in the top label row (e.g. `История`, `Гастрономия`) — i.e. theme chips render as labelled text, not icon-only.
   - Assert the bottom-row participant rules: solo card (Мцхета) has exactly 1 `participant-avatar` and no number; large card (Кахетия) has 3 avatars and shows `40`; no `из` / `/` capacity text anywhere in the section.
   - Keep the `ResizeObserver` mock.

## Verify before finishing
Run: `bun run typecheck && bun run lint && bun run test:run`
All must be green. Report what changed and the diff scope (must be exactly the two files above).
