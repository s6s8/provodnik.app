# TASK: Redesign the public request detail page to match the mockup (Сборная join page)

## Read FIRST, in order
1. `.cursor/rules/12-product-canon.mdc` — product canon (3 models; сборная has NO max/min). INVIOLABLE.
2. `.cursor/rules/27-request-detail-page.mdc` — this page's structure, content, delete list, guards.
3. `.cursor/mockups/request-detail.html` — the VISUAL CONTRACT. Your output must match its structure, hierarchy, blocks, and on-brand styling.
4. `.cursor/rules/01-context7-docs.mdc` — verify every Next.js 16 / React 19 / Tailwind v4 / shadcn API against context7 before writing. Do not guess.
5. `.cursor/rules/15-ui-ux-pro-max.mdc` — run the in-repo design-system search and follow the UI/UX skill.

## Goal
Rewrite the public request detail page so it matches the mockup exactly in structure and is faithful to provodnik's brand (Rubik, green #1F7A5C, cream #F7FAF6, shadcn tokens). The page serves ONE goal: convince a traveler to JOIN a сборная group. Public = сборная-only.

## Scope — edit ONLY these (≤6 files)
- `src/features/requests/components/public/public-request-detail-screen.tsx` — full rewrite to the mockup's blocks + sticky card + mobile bottom bar.
- `src/app/(site)/requests/[requestId]/page.tsx` — server component: build a mode-aware VIEW-MODEL; `notFound()` for non-assembly/private requests; use `cityImage(destination)` for the hero.
- `src/app/(site)/requests/page.tsx` — catalog: list ONLY сборная (open_to_join) requests.
- `src/data/open-requests/types.ts` — extend `OpenRequestRecord` only with fields the view-model needs (organizerName, themes, regionLabel, cityImageUrl) if missing.
- `src/lib/city-image.ts` — NEW small helper `cityImage(destination: string): string` returning a DETERMINISTIC online placeholder image URL per city. Add `// TODO: replace with curated per-city CDN`.
- sibling test files for the above.

## View-model (server → screen) — exactly the fields the mockup needs
`{ title, regionLabel, cityImageUrl, dateLabel, timeLabel, datesFlexible, pricePerPersonRub, memberCount, members[], organizerName, themes[], notes, joinState }`
`joinState ∈ 'anon' | 'can-join' | 'member' | 'owner' | 'closed'` — derived from viewer + status.

## Structure to build (match mockup, nothing extra)
hero(city image + «Сборная группа» badge + title ONCE + region) → meta chips(дата·время·Гибкие даты, lucide, hide flex if not flexible) → Кто едет(count + avatars + organizer + "группа открыта") → О поездке(theme chips + notes, hide if empty) → Как это работает(3 steps) → sticky decision card(price + добор line + ONE state-aware CTA + "гиды уже видят") → Частые вопросы(collapsed). Mobile: single column + fixed bottom bar(price + CTA).

## DELETE (must be gone)
buildPriceScenarios + «Стоимость на человека» table; "X из Y мест занято" + Progress fill; "О маршруте" + "Что запланировано"; "Формат" field; hardcoded Unsplash mountain fallback; hardcoded "Сборная группа" hero string (derive from data); duplicate destination.

## CTA states
anon → «Войти и присоединиться» (→ /auth?next=…) · can-join → «Присоединиться к группе» (JoinGroupButton) · member → «Вы в группе» · owner → quiet "Это ваша группа" · closed/expired → «Группа уже собрана» (no CTA).

## Must NOT touch
Guide offer capacity (bid-form-panel, offer-meta, guide inbox). DB schema/migrations. i18n keys / URLs. `traveler-request-detail-screen.tsx`. NEVER introduce a group max/min/capacity.

## Verify before finishing
- `npx tsc --noEmit` clean.
- `npx vitest run src/features/requests src/app/(site)/requests src/lib` green (add/update tests for the new structure + cityImage).
- Rendered page contains: title once, «Сборная группа» badge, the join CTA; and contains NONE of: "мест занято", "Стоимость на человека", "О маршруте".

## Commit
`feat(request-detail): redesign сборная join page to mockup — view-model + blocks, remove dead sections`
