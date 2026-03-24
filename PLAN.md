# Provodnik — Implementation Plan

> **Executor**: Codex (orchestrator) + Cursor (code writer)
> **Workspace**: `D:\dev\projects\provodnik\provodnik.app`
> **Package manager**: bun
> **Stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (radix-nova)
>
> **Source documents** — read all three before starting:
> - `D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md` — full design spec (canonical)
> - `D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md` — product requirements and data model changes
> - `D:\dev\projects\provodnik\design\LAYOUT.md` — page-by-page layout reference
>
> **Execution rules**:
> - Codex reads, plans, and delegates. Cursor writes code.
> - Each phase = one Cursor task. Do not combine phases.
> - After each phase: run `bun run lint && bun run typecheck`. Fix errors before moving on.
> - Do not touch files outside the phase scope.
> - All copy is Russian. Do not translate.
> - Use only Tailwind utilities + shadcn/ui. No custom CSS beyond what is already in globals.css.

---

## Phase 0 — Foundation: dark theme + layouts + navigation

**What**: Establish the dark theme system-wide. All other phases depend on this.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md sections 1-5 fully before writing any code.

Task: Implement the dark theme foundation.

Files to change:
1. src/app/globals.css
   - Replace :root palette with the dark palette from section 2 of the guide
   - Update body, .app-shell, .glass-panel, .section-frame, .editorial-kicker as specified
   - Remove body::before and .app-shell::after light theme gradient blocks

2. src/app/(home)/layout.tsx
   - Simplify to just pass children (background comes from globals.css)

3. src/app/(site)/layout.tsx
   - Rewrite to dark theme: SiteHeader + main container + SiteFooter
   - main: mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 md:py-12 lg:px-8

4. src/app/(protected)/layout.tsx
   - Rewrite to dark theme: remove light background, keep SiteHeader + WorkspaceRoleNav

5. src/components/shared/site-header.tsx
   - Full rewrite per section 5a of the guide
   - sticky top-0 z-50, bg-[rgba(15,15,15,0.7)] backdrop-blur-xl, border-b border-white/10
   - Nav: Logo | center search pill (desktop) | Направления / Запросы / Экскурсии / Гидам | Создать запрос (primary) | Войти
   - All buttons rounded-full
   - Mobile: hamburger

6. src/components/shared/site-footer.tsx
   - Rewrite to dark footer: bg-[#0a0a0a] border-t border-white/8
   - text-white/50 for body, text-white/80 for titles

Acceptance: bun run lint && bun run typecheck pass. App renders dark background globally. Nav is glassmorphic and sticky.
```

---

## Phase 1 — Data types: extend models for new product fields

**What**: Add new optional fields to existing TypeScript types. Backward-compatible — no existing code breaks.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md "Data model additions required" section.

Task: Extend TypeScript types with new optional fields.

Find the type definitions for:
- PublicListingItineraryItem (in src/features/listings/ or src/types/)
- OpenRequestRecord (in src/features/requests/ or src/types/)
- DestinationSummary (in src/features/destinations/ or src/types/)

Add these optional fields (all backward-compatible):

To PublicListingItineraryItem:
  travelToNextMinutes?: number;
  travelToNextLabel?: string;
  transportOptions?: Array<"walking" | "city_bus" | "taxi" | "own_car" | "guide_transport">;

To OpenRequestRecord:
  imageUrl?: string;
  regionLabel?: string;
  priceScenarios?: Array<{ groupSize: number; pricePerPersonRub: number }>;

To DestinationSummary (if imageUrl and description not already present):
  imageUrl?: string;
  description?: string;

Update seed data files to populate:
- destinationLabel as "Город, Регион" format (e.g. "Элиста, Калмыкия")
- regionLabel where present
- imageUrl with real Unsplash URLs for destinations and requests
- priceScenarios with 3-5 realistic entries per request record

Acceptance: bun run lint && bun run typecheck pass. No existing pages break.
```

---

## Phase 2 — New shared components

**What**: Four new components needed by multiple pages. Build them before the pages that use them.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md sections 4 (component patterns) and the new components table in STAKEHOLDER-FEEDBACK.md.

Task: Create four new components.

1. src/components/shared/transport-option-pill.tsx
   - Props: transport: "walking" | "city_bus" | "taxi" | "own_car" | "guide_transport"
   - Renders a pill with lucide icon + Russian label
   - Icons: walking=Footprints, city_bus=Bus, taxi=Car, own_car=Car, guide_transport=Users
   - Labels: пешком, автобус, такси, свой транспорт, транспорт гида
   - Style: inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/70

2. src/features/listings/components/public/itinerary-travel-segment.tsx
   - Props: minutes: number, label?: string, options?: TransportOption[]
   - Renders the connector between itinerary stops: ↕ 15 мин · pill pill pill
   - Style: flex items-center gap-2 py-2 text-xs text-white/50 before/after: border-l border-white/10

3. src/features/requests/components/public/price-scenario-card.tsx
   - Props: scenarios: Array<{ groupSize: number; pricePerPersonRub: number }>, currentGroupSize: number
   - Renders the "Как цена зависит от группы" glass card
   - Table rows: each groupSize + price, highlight currentGroupSize row with text-primary
   - Footer text: "При бронировании вы соглашаетесь на диапазон от X до Y ₽ на случай изменения состава"
   - Style: glass-panel rounded-[1.5rem] border border-white/10 p-5

4. src/features/guide/components/public/public-guide-card.tsx
   - Props: guide: { id, name, avatarUrl, rating, tourCount, specialties: string[], cities: string[] }
   - Compact card: avatar (rounded-full, size-14) | name (text-base font-semibold) | rating (★ x.x) | tourCount tours | specialty badges
   - Style: glass-panel rounded-[1.5rem] border border-white/10 p-4 flex gap-4 items-start
   - Hover: hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300
   - Links to /guide/[id]

Acceptance: bun run lint && bun run typecheck pass. Components render without errors in isolation.
```

---

## Phase 3 — Homepage `/`

**What**: Full rewrite of the homepage with dual-entry architecture.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 1 section fully.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md Change 1, Change 2, Change 7.
Read D:\dev\projects\provodnik\design\LAYOUT.md slides 1–2.

Task: Rebuild the homepage with dual-entry architecture.

File: src/features/homepage/components/homepage-shell.tsx (REWRITE)
Route: src/app/(home)/page.tsx (keep thin, just renders HomepageShell)

Layout (top to bottom):
1. HERO SECTION (min-h-[50vh])
   - Full-bleed cinematic background photo (Unsplash travel URL)
   - Gradient overlay: bg-gradient-to-b from-black/40 via-black/20 to-black/80
   - Centered content:
     - Kicker: "Маршруты с локальными проводниками" (editorial-kicker class)
     - H1: "Объединяйтесь. Договаривайтесь. Путешествуйте дешевле."
       (text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white)
     - Search bar: rounded-full glass pill, placeholder "Куда едем?", links to /destinations
     - Two CTA buttons: "Создать запрос" (primary, lg) | "Найти группу" (outline, lg)

2. DUAL GATEWAY (grid grid-cols-1 md:grid-cols-2 gap-6, full-width section)
   LEFT card — БИРЖА:
   - glass-panel rounded-[2rem] border border-white/10 p-8
   - Icon: Users (lucide, size-10, text-primary)
   - H2: "Биржа запросов"
   - Body: "Объединяйтесь в группы и договаривайтесь о цене с местными гидами"
   - CTA1: Button variant=default size=lg → /requests/new ("Создать запрос")
   - CTA2: Button variant=outline → /requests ("Найти группу")
   - Mini-grid: 2 OpenRequestPreviewCard components from seed data

   RIGHT card — ГОТОВЫЕ ТУРЫ:
   - glass-panel rounded-[2rem] border border-white/10 p-8
   - Icon: MapPin (lucide, size-10, text-accent)
   - H2: "Готовые предложения"
   - Body: "Выбирайте из действующих предложений гидов и турагенств"
   - CTA1: Button variant=default size=lg → /listings ("Смотреть каталог")
   - CTA2: Button variant=outline → /destinations ("По направлениям")
   - Mini-grid: 2 ListingPreviewCard components from seed data

3. HOW IT WORKS (5-step horizontal flow)
   - Kicker: "Как это работает"
   - H2: "Пять шагов до незабываемой экскурсии"
   - 5 steps in a horizontal scrollable row on mobile, grid on desktop:
     1. Создать запрос — Icon: PlusCircle
     2. Группа формируется — Icon: Users
     3. Гиды предлагают цену — Icon: Tag
     4. Договаривайтесь — Icon: Handshake
     5. Экскурсия подтверждена — Icon: CheckCircle
   - Each step: number badge + icon + title + short description (1 line)
   - Connected by arrow or subtle line between steps

4. POPULAR DESTINATIONS (full-width section)
   - Kicker + H2: "Популярные направления"
   - Grid: featured card (md:col-span-2) + 2 standard cards
   - DestinationCard: photo overlay, city name, short description overlay

5. SiteFooter

Acceptance: bun run lint && bun run typecheck pass. Dual gateway renders with equal column widths. All links resolve.
```

---

## Phase 4 — Requests Marketplace `/requests`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 2 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 3.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md Change 3.

Task: Rebuild the requests marketplace page.

Route: src/app/(site)/requests/page.tsx
Feature: src/features/requests/components/public/ (rewrite or create as needed)

Layout:
1. Page header
   - H1: "Маркетплейс запросов"
   - Subheading: "Присоединяйтесь к группам и путешествуйте по лучшей цене"
   - Primary CTA: "Создать запрос" → /requests/new

2. Glass filter bar (glass-panel rounded-[1.5rem] border border-white/10 p-4)
   - Filter pills: Все регионы | По дате | По бюджету | По размеру группы
   - Each pill: rounded-full, active=bg-primary text-white, inactive=bg-white/8 border-white/10

3. Request cards grid (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5)
   Each OpenRequestCard shows:
   - Image (photo overlay style, min-h-[220px]) or glass card if no image
   - Destination: "Город, Регион" format (regionLabel if present)
   - Date range (period, not exact date)
   - Group progress: stacked avatars + progress bar + "X из Y участников"
   - Budget: "от ~X ₽/чел"
   - Status badge: "Открыт" (default variant)
   - CTA: "Присоединиться" button (primary, sm)

4. Empty state if no requests: glass card with Users icon + "Нет открытых запросов" + "Создать запрос" CTA

Acceptance: bun run lint && bun run typecheck pass. Cards render with seed data. Region shows in "Город, Регион" format.
```

---

## Phase 5 — Request Detail `/requests/[id]`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 3 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 4.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md Change 5.

Task: Rebuild the request detail page.

Route: src/app/(site)/requests/[id]/page.tsx
Feature: src/features/requests/components/public/request-detail.tsx (rewrite)

Layout (split: grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8):

LEFT COLUMN (main content):
1. Hero: destination photo (cinematic, min-h-[320px]) with gradient + destination label overlay
2. Request metadata glass card:
   - Destination: "Город, Регион"
   - Date range
   - Group size target
   - Budget per person
   - Status badge
3. Participants section:
   - H3: "Участники группы"
   - Stacked avatars row
   - Progress bar: X из Y участников
   - "Присоединиться к группе" button (primary, full-width)
4. Guide offers section (if any):
   - H3: "Предложения гидов"
   - Each offer card: guide avatar + name + rating + price + "Принять" button + "Встречная цена" button

RIGHT COLUMN (sidebar):
1. PriceScenarioCard component (from Phase 2)
   - Use request.priceScenarios if present
   - Compute from priceTotalRub / groupSize variants if not present
2. Quick request summary glass card (destination, dates, budget recap)
3. "Создать похожий запрос" CTA

Acceptance: bun run lint && bun run typecheck pass. PriceScenarioCard renders. Split layout on desktop.
```

---

## Phase 6 — Create Request `/requests/new`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 4 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 5.

Task: Rebuild the create request page.

Route: src/app/(site)/requests/new/page.tsx (or protected equivalent)
Feature: src/features/requests/components/public/create-request-form.tsx (rewrite)

Layout (split: grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8):

LEFT: Form (glass-panel rounded-[2rem] border border-white/10 p-6 sm:p-8)
Fields (all rounded-full or rounded-[1.2rem] inputs):
  1. Город / регион (text input with location icon)
  2. Даты: диапазон дат (date range picker)
  3. Количество участников (number input or stepper)
  4. Целевой бюджет на человека (₽, number input)
  5. Toggle: "Открытая группа" (любой может присоединиться)
  6. Toggle: "Принимать предложения от гидов"
  7. Описание (textarea, optional)
  Submit: "Создать запрос" (primary, lg, full-width)

RIGHT: Live preview card
  - H3: "Как будет выглядеть ваш запрос"
  - OpenRequestCard preview rendered from form state
  - Updates as user types
  - Shows "Город, Регион" format

Acceptance: bun run lint && bun run typecheck pass. Form renders. Preview updates with form values.
```

---

## Phase 7 — Destination Page `/destinations/[slug]`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 5 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 6.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md Change 6.

Task: Rebuild the destination page.

Route: src/app/(site)/destinations/[slug]/page.tsx
Feature: src/features/destinations/components/public/ (rewrite as needed)

Layout (stacked sections):
1. Hero: full-width cinematic city photo (min-h-[50vh])
   - Gradient: from-black/70 via-black/30 to-transparent
   - Overlay: city name (H1, large), short description, region badge

2. Section: "Открытые группы в этом городе"
   - Kicker + H2
   - Grid of OpenRequestCard (filtered by destination)
   - "Все запросы в этом городе" link → /requests?destination=slug

3. Section: "Популярные туры"
   - Kicker + H2
   - Grid of ListingCard (photo overlay, min-h-[280px])
   - Featured first card: md:col-span-2

4. Section: "Гиды в этом городе" (NEW — from Change 6)
   - Kicker + H2: "Местные проводники"
   - Grid of PublicGuideCard (from Phase 2)
   - "Все гиды" link

5. SiteFooter

Acceptance: bun run lint && bun run typecheck pass. All three sections render. GuideCard component used.
```

---

## Phase 8 — Tour Listing Detail `/listings/[id]`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 6 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 7.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md Change 4.

Task: Rebuild the tour listing detail page.

Route: src/app/(site)/listings/[id]/page.tsx
Feature: src/features/listings/components/public/listing-detail.tsx (rewrite)

Layout (split: grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8):

LEFT (main):
1. Hero photo (cinematic, min-h-[400px]) + gradient overlay + title + guide avatar + rating
2. Description glass card
3. Included / not included pills (two columns)
4. ITINERARY SECTION with travel segments (NEW — from Change 4):
   - H3: "Маршрут экскурсии"
   - For each stop: ItineraryStopCard (glass, title, description, durationHours)
   - Between stops: ItineraryTravelSegment component (from Phase 2)
     showing travelToNextMinutes + TransportOptionPill[] for each transportOption
   - Last stop has no segment connector below it
5. Reviews section (if present)

RIGHT (sidebar):
1. Booking glass card:
   - Price range
   - TWO primary actions (equal weight):
     - "Создать запрос на этот тур" (primary)
     - "Присоединиться к группе" (outline)
   - Note: не мгновенная покупка — это demand-first platform
2. Guide profile mini-card: avatar, name, rating, tourCount, link to /guide/[id]

Acceptance: bun run lint && bun run typecheck pass. ItineraryTravelSegment renders between stops. Transport pills visible.
```

---

## Phase 9 — Guide Profile `/guide/[id]`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 7 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 8.

Task: Rebuild the guide profile page.

Route: src/app/(site)/guide/[id]/page.tsx
Feature: src/features/guide/components/public/guide-profile.tsx (rewrite)

Layout:
1. Profile hero (glass-panel, not photo-overlay):
   - Large avatar (size-24, rounded-full)
   - Name (H1), rating (★ X.X), tour count, cities covered
   - Specialty badges (secondary variant, rounded-full)
   - "Предложить тур моей группе" CTA (primary)

2. Section: "Туры этого гида"
   - Kicker + H2
   - Grid of ListingCard (photo overlay)

3. Section: "Активные предложения гидам"
   - H2: "Предложения группам"
   - Cards: each offer shows destination, date, price, group status
   - CTA per card: "Рассмотреть"

4. Section: "Завершённые экскурсии"
   - Compact list of past tours with rating + date

Acceptance: bun run lint && bun run typecheck pass. All sections render with seed data.
```

---

## Phase 10 — Traveler Dashboard `/workspace/traveler`

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md PAGE 8 section fully.
Read D:\dev\projects\provodnik\design\LAYOUT.md slide 9.

Task: Rebuild the traveler dashboard.

Route: src/app/(protected)/workspace/traveler/page.tsx (or equivalent protected route)
Feature: src/features/workspace/ or src/features/dashboard/ (rewrite as needed)

Layout:
1. Page header:
   - H1: "Мой кабинет" + user avatar + name
   - Quick stats row (glass pills): N запросов | M групп | K предложений

2. Tabs (shadcn Tabs component):
   - "Мои запросы"
   - "Группы"
   - "Предложения гидов"
   - "Бронирования"

   Tab: "Мои запросы"
   - Grid of request cards (same OpenRequestCard used in marketplace)
   - Empty state if none

   Tab: "Группы"
   - Cards: destination + date + participants + status badge
   - Statuses: "Формируется" | "Идут переговоры" | "Подтверждено"

   Tab: "Предложения гидов"
   - Each card: guide name + price + tour title + "Принять" / "Отклонить" buttons

   Tab: "Бронирования"
   - Confirmed bookings: tour name + date + price + "Подтверждено" badge

Acceptance: bun run lint && bun run typecheck pass. Tabs switch correctly. All tab content renders.
```

---

## Phase 11 — SQL seed data

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Read all existing seed files under src/data/ or supabase/seed/ (find them first).
Read D:\dev\projects\provodnik\design\IMPLEMENTATION-GUIDE.md data requirements sections.
Read D:\dev\projects\provodnik\design\STAKEHOLDER-FEEDBACK.md data model additions.

Task: Create/update SQL seed files with production-quality data.

Requirements:
- All copy in Russian
- Destinations: minimum 6 with real Russian cities + regions
  (Элиста + Калмыкия, Казань + Татарстан, Санкт-Петербург + Ленобласть, Москва + МО, Сочи + Краснодарский край, Байкал + Иркутская область)
- Each destination: imageUrl (real Unsplash travel photo URL), description (2-3 sentences Russian)
- Open requests: minimum 8, each with:
  - destinationLabel: "Город, Регион" format
  - regionLabel populated
  - imageUrl (Unsplash)
  - priceScenarios: 4-5 entries (groupSize 2-8, realistic prices in ₽)
  - date range (not exact date)
- Tour listings: minimum 6, each with:
  - itinerary with 3-5 stops
  - travelToNextMinutes between stops (realistic)
  - transportOptions arrays per segment
- Guides: minimum 4, each with:
  - avatarUrl (Unsplash portrait)
  - rating (4.5–5.0)
  - specialties array
  - cities array

Output files:
- supabase/seed/destinations.sql (or update existing)
- supabase/seed/listings.sql (or update existing)
- supabase/seed/requests.sql (or update existing)
- supabase/seed/guides.sql (or update existing)

If Supabase is not used and seed data is TypeScript, output .ts files instead in src/data/.

Acceptance: SQL files are valid. All INSERT statements use the updated schema with new optional fields. No broken references.
```

---

## Final verification

After all phases complete, run:

```bash
cd D:\dev\projects\provodnik\provodnik.app
bun run lint
bun run typecheck
bun run build
```

All must pass clean. Fix any remaining issues before marking complete.

---

## Codex execution command

```bash
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN.md fully. Execute it phase by phase starting from Phase 0. For each phase, delegate the Cursor task verbatim to: cursor-agent --model auto --yolo -p with the workspace set to D:\dev\projects\provodnik\provodnik.app. After each phase, run bun run lint && bun run typecheck. Fix any errors before proceeding to the next phase. Do not skip phases. Do not combine phases. Report phase completion and any blockers."
```
