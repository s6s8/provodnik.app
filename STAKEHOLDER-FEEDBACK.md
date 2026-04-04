# Stakeholder Feedback Analysis — 2026-03-13

> Source: GG feedback on slides 1–9. Reviewed against existing
> IMPLEMENTATION-GUIDE.md, PRD.md, MVP.md, and current codebase.

---

## Summary of changes required

GG's feedback introduces **6 structural product insights** that affect page
layouts, data models, and the core UX hierarchy. The current implementation
guide is accurate on visual treatment (dark theme, glassmorphism, card patterns)
but needs corrections to **information architecture and product flow**.

---

## Change 1 — Homepage: Dual-entry architecture

### What GG said

> Наряду с биржей необходимо разместить действующие предложения гидов и
> турагенств [...] можно сделать на главной странице два равно размерных окна.

The homepage should present **two equal entry points**, not one hero + sections:

| Left half | Right half |
|-----------|------------|
| **Биржа** — "Join travelers" | **Готовые туры** — "Choose existing offers" |
| Request-first, demand-driven | Catalog-first, supply-driven |

### Why it matters

The exchange concept (биржа) is novel. Users need a familiar catalog path
alongside it. AI can quickly populate the catalog with existing offers from
around the world, giving immediate value while the exchange grows organically.

### Impact on IMPLEMENTATION-GUIDE.md

Complete restructure of PAGE 1 (Homepage) layout. Replace the linear
hero → action cards → sections flow with a **split-screen gateway** that
leads into two distinct but connected product paths.

### Updated homepage wireframe

```
┌──────────────────────────────────────────────────┐
│ Glass nav bar (SiteHeader)                        │
├──────────────────────────────────────────────────┤
│ HERO SECTION (compact, max-h-[50vh])              │
│  Kicker + H1 explaining the platform              │
│  Search bar                                       │
├──────────────────────────────────────────────────┤
│ DUAL GATEWAY (two equal columns)                  │
│ ┌─────────────────────┬────────────────────────┐ │
│ │ LEFT: БИРЖА         │ RIGHT: ГОТОВЫЕ ТУРЫ    │ │
│ │ "Объединяйтесь в    │ "Выбирайте из готовых  │ │
│ │  группы и            │  предложений гидов и   │ │
│ │  договаривайтесь     │  турагенств"           │ │
│ │  о цене"             │                        │ │
│ │                      │                        │ │
│ │ CTA: Создать запрос  │ CTA: Смотреть каталог  │ │
│ │ CTA: Найти группу    │ CTA: По направлениям   │ │
│ │                      │                        │ │
│ │ Mini-grid: 2-3 open  │ Mini-grid: 2-3 featured│ │
│ │ request cards        │ listing cards           │ │
│ └─────────────────────┴────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ POPULAR DESTINATIONS section                      │
├──────────────────────────────────────────────────┤
│ HOW IT WORKS section (3-step flow)                │
├──────────────────────────────────────────────────┤
│ SiteFooter                                        │
└──────────────────────────────────────────────────┘
```

---

## Change 2 — Action priority: "Создать запрос" is first

### What GG said

> • создать запрос  (это на первом месте)
> • найти группу
> • исследовать направления

### Impact

The current guide had "Найти группу" first. Reorder all CTA lists, navigation
hints, and action cards to put "Создать запрос" first everywhere. This
reinforces the demand-first positioning from the PRD.

---

## Change 3 — Region info everywhere, not just city

### What GG said

> надо еще указать регион. Если едут на несколько дней, то включают пос. Адык.
> Это уже районный поселок в 140 км.

### Impact

- Request cards: show "Город, Регион" not just "Город"
- Filter bars: add region filter
- Destination concept: destinations can be regions, not just cities
- Seed data: ensure all records have region populated

The `OpenRequestRecord` type already has `destinationLabel: string`. This should
be formatted as "Город, Регион" in seed data. No type change required — just
ensure seed and display follow the convention.

---

## Change 4 — Tour constructor with travel segments and transport

### What GG said (Kalmykia example)

> Экскурсии часто состоят из нескольких локаций разной удаленности друг от
> друга [...] пешеходная экскурсия 1-1.5 часа, до хурула 15 мин дорога [...]
> варианты: городской автобус, такси, собственный транспорт.

### Impact on data model

`PublicListingItineraryItem` currently has:
```ts
{ title: string; description: string; durationHours: number }
```

Needs to become:
```ts
{
  title: string;
  description: string;
  durationHours: number;
  /** Travel time to next stop in minutes. Null for last stop. */
  travelToNextMinutes?: number;
  /** Distance to next stop for context. */
  travelToNextLabel?: string;
  /** Available transport between this stop and next. */
  transportOptions?: Array<"walking" | "city_bus" | "taxi" | "own_car" | "guide_transport">;
}
```

### Impact on UI (PAGE 6 — Tour Listing Detail)

The itinerary section needs to show **travel segments between stops**:

```
┌─ Stop 1: Пешеходная экскурсия по центру (1.5 ч) ──────┐
│  Description text                                       │
└─────────────────────────────────────────────────────────┘
     ↕ 15 мин · Автобус / Такси / Свой транспорт
┌─ Stop 2: Золотая обитель Будды Шакьямуни (1 ч) ────────┐
│  Description text                                       │
└─────────────────────────────────────────────────────────┘
     ↕ 20 мин · Такси / Свой транспорт
┌─ Stop 3: Сити Чесс (0.5 ч) ───────────────────────────┐
│  Description text                                       │
└─────────────────────────────────────────────────────────┘
```

The transport options are shown as info pills between stops.

### Impact on Create Request form (PAGE 4)

The "tour constructor" concept means that when a traveler creates a request,
the guide may later propose a modular itinerary. The create-request form itself
does NOT need constructor UI — this is the guide's response format. But the
request detail page (PAGE 3) should render constructor-style itineraries when
a guide's offer includes them.

---

## Change 5 — Price risk display (group shrinkage scenarios)

### What GG said

> Надо также показать туристу, что будет, если вдруг группа уменьшится (форс
> мажор) и сумма за экскурсию возрастет. Он должен согласиться, например, на
> диапазон увеличения в случае непредвиденного уменьшения группы.

### Impact on UI (PAGE 3 — Request Detail)

Add a **Price Scenarios** glass card to the request detail page:

```
┌─ Как цена зависит от группы ──────────────────────────┐
│                                                        │
│  6 участников   ~4 200 ₽ / чел.                       │
│  5 участников   ~5 000 ₽ / чел.                       │
│  4 участника    ~6 300 ₽ / чел.  ← текущий прогноз    │
│  3 участника    ~8 400 ₽ / чел.                       │
│                                                        │
│  При бронировании вы соглашаетесь на диапазон          │
│  от 4 200 до 8 400 ₽ на случай изменения состава.     │
└────────────────────────────────────────────────────────┘
```

### Impact on data model

`OpenRequestRecord` or the guide offer needs a field for price scenarios:
```ts
priceScenarios?: Array<{ groupSize: number; pricePerPersonRub: number }>;
```

Or this can be computed on the fly from `priceTotalRub / groupSize` variants.

### Impact on booking flow

Before confirming, the traveler must acknowledge the price range. This is a
UX element on the booking confirmation page (not MVP-blocking but should be
designed into the request detail page now).

---

## Change 6 — Destination page: add "Гиды в этом городе"

### What GG said

> Он видит: популярные экскурсии, открытые группы, гидов в этом городе

### Impact

The current guide's destination page has two sections (groups + tours). Add a
third section: "Гиды в этом городе" showing guide profile cards filtered by
the destination's region.

Updated destination page wireframe:
```
┌─────────────────────────────────────────────────┐
│ Hero: city photo + name + description            │
├─────────────────────────────────────────────────┤
│ Section: "Открытые группы в этом городе"         │
├─────────────────────────────────────────────────┤
│ Section: "Популярные туры"                       │
├─────────────────────────────────────────────────┤
│ Section: "Гиды в этом городе"  ← NEW            │
│  Grid of GuideCards (avatar, name, rating,       │
│  specialties, tour count)                        │
├─────────────────────────────────────────────────┤
│ SiteFooter                                       │
└─────────────────────────────────────────────────┘
```

### New component needed

`GuideCard` — compact card with avatar, name, rating, specialties, link to
profile. Place in `src/features/guide/components/public/public-guide-card.tsx`.

---

## Change 7 — Platform narrative: demand-first paradigm

### What GG said

> В целом идею биржи можно внедрить в разные сферы и создать новую сферу, в
> центре которой находится запрос человека, а предприниматели предлагают свою
> цену и услугу. Это масштабный сдвиг на самом деле.

This confirms the PRD thesis. No code change needed but every page's copy and
information hierarchy should reinforce: **the request is the center of gravity,
not the catalog listing**.

### How it works section (for homepage)

The five-step flow GG described should appear on the homepage:

1. Турист создаёт запрос
2. Другие присоединяются к группе
3. Гиды предлагают цену
4. Группа договаривается о стоимости
5. Экскурсия подтверждается

---

## Cross-reference: What the current guide already handles correctly

| Aspect | Status |
|--------|--------|
| Dark theme, glassmorphism, glass nav | Correct |
| Tailwind + shadcn only | Correct |
| Card patterns and component markup | Correct |
| Route structure and file paths | Correct |
| Data seed approach | Correct |
| Implementation order (phases) | Correct — but homepage spec needs updating |
| Typography and color system | Correct |
| Module boundaries | Correct |
| Quality checklist | Correct |
| Russian copy | Correct |

---

## Data model additions required

### 1. `PublicListingItineraryItem` — add travel segment fields

```ts
// Add to existing type (optional fields, backward-compatible)
travelToNextMinutes?: number;
travelToNextLabel?: string;
transportOptions?: Array<"walking" | "city_bus" | "taxi" | "own_car" | "guide_transport">;
```

### 2. `OpenRequestRecord` — add optional image and region

```ts
// Already has destinationLabel. Add:
imageUrl?: string;
regionLabel?: string;
```

### 3. Price scenarios (new type or computed)

```ts
// Can be on OpenRequestRecord or computed from offer data
priceScenarios?: Array<{ groupSize: number; pricePerPersonRub: number }>;
```

### 4. `DestinationSummary` — needs `imageUrl` and `description` in seed

Already in type. Just populate in seed data.

---

## New components identified

| Component | Path | Reason |
|-----------|------|--------|
| `GuideCard` | `src/features/guide/components/public/public-guide-card.tsx` | For destination page "Гиды в этом городе" section |
| `PriceScenarioCard` | `src/features/requests/components/public/price-scenario-card.tsx` | For request detail page price risk display |
| `ItineraryTravelSegment` | `src/features/listings/components/public/itinerary-travel-segment.tsx` | For showing transport options between itinerary stops |
| `TransportOptionPill` | `src/components/shared/transport-option-pill.tsx` | Pill showing transport icon + label |

---

## Updated implementation priority within the guide

The homepage dual-entry architecture is the most significant structural change.
It should be finalized in the design guide BEFORE Phase 3 implementation begins.

The itinerary travel segments and price scenarios are important product concepts
but can ship as Phase 4b (enhancement to tour listing and request detail pages)
rather than blocking the initial page builds.
