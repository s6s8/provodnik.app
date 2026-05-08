# Phase 5.4 — Traveler surfaces: tour shape listing detail

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-4`
**Branch:** `feat/tripster-v1-p5-4`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite (5.3 merged):**
- `/listings/[id]/page.tsx` exists and renders `ExcursionShapeDetail` for all types
- `PhotoGallery`, `ScheduleDisplay`, `TariffsList`, `GuideCard` components exist
- `maskPii` from `@/lib/pii/mask`

**Sub-flag gate:** This template is behind `FEATURE_TRIPSTER_TOURS`.

**Relevant types:**
```ts
export type ListingRow = { /* full shape */ };
export type ListingDayRow = { listing_id: string; day_number: number; title: string | null; body: string | null; date_override: string | null; };
export type ListingMealRow = { listing_id: string; day_number: number; meal_type: "breakfast" | "lunch" | "dinner"; status: "included" | "paid_extra" | "not_included"; note: string | null; };
export type ListingTourDepartureRow = { id: string; listing_id: string; start_date: string; end_date: string; price_minor: number; currency: string; max_persons: number; status: string; };
```

**shadcn/ui:** Button, Badge, Card, Separator, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent

## SCOPE

**Create:**
1. `src/components/listing-detail/TourShapeDetail.tsx` — tour detail template
2. `src/components/listing-detail/TourItineraryDisplay.tsx` — day-by-day itinerary
3. `src/components/listing-detail/TourDeparturesList.tsx` — fixed departure dates

**Modify:**
4. `src/app/(public)/listings/[id]/page.tsx` — add tour routing with `FEATURE_TRIPSTER_TOURS` gate

**DO NOT touch:** `ExcursionShapeDetail`, editor components.

## TASK

### 1. TourItineraryDisplay.tsx

Props: `{ days: ListingDayRow[] }`

Render as accordion or numbered list:
- "День 1: {title}" — expandable body
- If date_override: show date next to day number
- Collapse/expand all button
- If days empty: show nothing (null)

### 2. TourDeparturesList.tsx

Props: `{ departures: ListingTourDepartureRow[] }`

Show as list of cards:
- Date range: "{start_date} — {end_date}"
- Duration: compute from dates
- Price: price_minor ÷ 100 formatted as "от X ₽"
- Status badge: active=green, sold_out=orange, cancelled=muted
- "Забронировать" Button → `/listings/{departure.listing_id}/book?departure={departure.id}`

If no active departures: "Нет доступных дат — запросите индивидуальный тур"

### 3. TourShapeDetail.tsx

Props:
```ts
interface Props {
  listing: ListingRow;
  photos: ListingPhotoRow[];
  tariffs: ListingTariffRow[];
  days: ListingDayRow[];
  meals: ListingMealRow[];
  departures: ListingTourDepartureRow[];
  guide: GuideProfileRow | null;
}
```

Apply `maskPii` to text fields. Layout (similar to ExcursionShapeDetail but tour-specific):

Tabs at top: "Описание" | "Программа" | "Даты и цены"

**Описание tab:**
- `<PhotoGallery>`
- description, included/not_included (as tag clouds)
- difficulty_level badge
- accommodation summary
- `<GuideCard>`

**Программа tab:**
- `<TourItineraryDisplay days={days} />`
- Meals grid summary (breakfast/lunch/dinner per day, simple table)

**Даты и цены tab:**
- `<TourDeparturesList departures={departures} />`
- `<TariffsList tariffs={tariffs} priceFromMinor={listing.price_from_minor} />`

Tour-operator trust chip (if guide.is_tour_operator):
```tsx
<Badge variant="outline" className="...">
  Туроператор
</Badge>
```

### 4. Modify page.tsx

In the listing detail router:
```tsx
import { flags } from "@/lib/flags";
// ...
// Replace the placeholder comment for tour routing:
if (listing.exp_type === "tour") {
  if (!flags.FEATURE_TRIPSTER_TOURS) {
    // Fall back to excursion shape for tours when flag off
    return <ExcursionShapeDetail listing={listing} photos={photos} schedule={schedule} tariffs={tariffs} guide={guide} />;
  }
  
  const [daysRes, mealsRes, departuresRes] = await Promise.all([
    supabase.from("listing_days").select("*").eq("listing_id", id).order("day_number"),
    supabase.from("listing_meals").select("*").eq("listing_id", id),
    supabase.from("listing_tour_departures").select("*").eq("listing_id", id).eq("status", "active").order("start_date"),
  ]);
  
  return <TourShapeDetail
    listing={listing}
    photos={photos}
    tariffs={tariffs}
    days={daysRes.data ?? []}
    meals={mealsRes.data ?? []}
    departures={departuresRes.data ?? []}
    guide={guide}
  />;
}
```

## INVESTIGATION RULE

Before writing, read:
- `src/app/(public)/listings/[id]/page.tsx` — existing structure
- `src/components/listing-detail/ExcursionShapeDetail.tsx` — patterns to follow
- `src/lib/flags.ts` — FEATURE_TRIPSTER_TOURS flag name

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-4`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 3 new files + 1 modification
- Tour detail shows itinerary, meals, departures in tabs
- `FEATURE_TRIPSTER_TOURS` gates the template
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(traveler): tour-shape listing detail — itinerary/meals/departures tabs`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
