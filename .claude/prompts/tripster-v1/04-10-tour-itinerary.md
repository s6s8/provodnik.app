# Phase 4.10 — ListingEditorV1: tour itinerary sections

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-10`
**Branch:** `feat/tripster-v1-p4-10`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite (4.1–4.9 already merged):**
All shared section leaves and the completeness panel exist. The tour type (`exp_type="tour"`) uses these sections:
`["basics", "photos", "itinerary", "meals_grid", "tariffs", "included_excluded", "difficulty", "accommodation", "departures", "meeting_point"]`

Of these, `basics`, `photos`, `tariffs`, and `meeting_point` are already implemented as shared leaves. This wave implements the remaining 6 tour-specific sections.

**Section contract:**
```ts
interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}
```

**Relevant types from `src/lib/supabase/types.ts`:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  included: string[];
  not_included: string[];
  difficulty_level: "easy" | "medium" | "hard" | "extreme" | null;
  accommodation: Record<string, unknown> | null;
  image_url: string | null;
  // ...all other fields from ListingRow
};

export type ListingDayRow = {
  listing_id: string;
  day_number: number;   // 1-based
  title: string | null;
  body: string | null;
  date_override: string | null; // "YYYY-MM-DD"
};

export type ListingMealRow = {
  listing_id: string;
  day_number: number;
  meal_type: "breakfast" | "lunch" | "dinner";
  status: "included" | "paid_extra" | "not_included";
  note: string | null;
};

export type ListingTourDepartureRow = {
  id: string;
  listing_id: string;
  start_date: string;  // "YYYY-MM-DD"
  end_date: string;    // "YYYY-MM-DD"
  price_minor: number;
  currency: string;
  max_persons: number;
  status: string;      // "active" | "cancelled" | "sold_out"
};
```

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**shadcn/ui available:** Button, Input, Textarea, Label, Select, Badge, Card, Separator, Skeleton, Tabs

## SCOPE

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/sections/ItinerarySection.tsx`
2. `src/features/guide/components/listings/ListingEditorV1/sections/MealsGridSection.tsx`
3. `src/features/guide/components/listings/ListingEditorV1/sections/IncludedExcludedSection.tsx`
4. `src/features/guide/components/listings/ListingEditorV1/sections/DifficultySection.tsx`
5. `src/features/guide/components/listings/ListingEditorV1/sections/AccommodationSection.tsx`

**Modify:**
6. `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — add new exports
7. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — add 5 new entries to SECTION_COMPONENTS

**Note: DeparturesSection** (for `departures` key) is handled in wave 4.12.

**DO NOT touch:** types.ts, useAutosave.ts, BasicsSection, PhotosSection, ScheduleSection, TariffsSection, MeetingPointSection, or any other existing files.

## TASK

### 1. ItinerarySection (direct Supabase, SectionKey="itinerary")

Tour day-by-day itinerary using the `listing_days` table.

- On mount: `supabase.from("listing_days").select("*").eq("listing_id", listing.id).order("day_number", { ascending: true })`
- Render each day as an expandable card: "День {day_number}: {title || 'Без названия'}"
- Each day: title Input + body Textarea (rows=4)
- "Добавить день" button: inserts next day_number, empty title/body
  ```ts
  supabase.from("listing_days").insert({
    listing_id: listing.id,
    day_number: days.length + 1,
    title: "",
    body: "",
  })
  ```
- Save on blur: `supabase.from("listing_days").update({ title, body }).eq("listing_id", listing.id).eq("day_number", day.day_number)`
- Delete day button: delete from listing_days, then re-number remaining days
  - After delete: `supabase.from("listing_days").update({ day_number: i+1 }).eq("listing_id", listing.id).eq("day_number", days[i].day_number)` for each shifted day
- date_override: optional date Input ("Привязать к конкретной дате")
- Use Skeleton while loading

### 2. MealsGridSection (direct Supabase, SectionKey="meals_grid")

Grid: rows = days, columns = [breakfast, lunch, dinner].

- Fetch `listing_days` (for row labels) and `listing_meals` both.
- Render as HTML table: day rows × meal type columns
- Each cell: Select with options:
  - "included" → "Включено"
  - "paid_extra" → "За доп. плату"
  - "not_included" → "Не включено" (default)
- On change: upsert into `listing_meals`:
  ```ts
  supabase.from("listing_meals").upsert({
    listing_id: listing.id,
    day_number,
    meal_type,
    status: value,
    note: null,
  }, { onConflict: "listing_id,day_number,meal_type" })
  ```
- If no days yet, show message "Сначала добавьте программу тура в разделе «Программа»"

### 3. IncludedExcludedSection (updates ListingRow via onChange, SectionKey="included_excluded")

Two tag-list editors:
- `included` — label "Включено в стоимость"
- `not_included` — label "Не включено в стоимость"

Each tag-list:
- Show existing items as removable badges
- Input to add new item (press Enter or click "Добавить")
- Remove: filter out the item
- On change: `onChange({ included: newArray })` or `onChange({ not_included: newArray })`

Pre-populate `included` from `merged.included` and `not_included` from `merged.not_included` (where merged = `{ ...listing, ...draft }`).

Common suggestions (show as clickable chips below the input to quick-add):
- included: "Экипировка", "Гид", "Страховка", "Транспорт", "Питание"
- not_included: "Авиабилеты", "Визы", "Личные расходы", "Чаевые"

### 4. DifficultySection (updates ListingRow via onChange, SectionKey="difficulty")

Select `difficulty_level` from 4 options:
- "easy" → "🟢 Лёгкий — подходит для всех, нет физических ограничений"
- "medium" → "🟡 Средний — требуется базовая физическая подготовка"
- "hard" → "🔴 Сложный — необходима хорошая физическая форма"
- "extreme" → "⚫ Экстремальный — профессиональная физподготовка"

Use shadcn Select. On change: `onChange({ difficulty_level: value })`.

Also show a short description text below the select explaining what each level means for travelers.

### 5. AccommodationSection (updates ListingRow via onChange, SectionKey="accommodation")

`accommodation` is `Record<string, unknown>` (jsonb). Implement as structured form:

Known fields:
- `type` — Select: "hotel" → "Отель", "hostel" → "Хостел", "guesthouse" → "Гостевой дом", "camping" → "Кемпинг", "apartment" → "Апартаменты", "included" → "Включено в тур", "own" → "Самостоятельно"
- `description` — Textarea optional (описание проживания)
- `stars` — number Input optional (если отель — звёздность)

On any change: rebuild the object and call:
```ts
onChange({ accommodation: { type, description, stars } })
```

Initialize from `merged.accommodation` (parse known keys).

## INVESTIGATION RULE

Before writing anything, read:
- `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — current exports
- `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — SECTION_COMPONENTS map
- `src/features/guide/components/listings/ListingEditorV1/sections/BasicsSection.tsx` — SectionProps definition
- `src/lib/supabase/types.ts` — confirm all type shapes

Never assume. If an import doesn't exist, trace back and find the real one.

## TDD CONTRACT

No unit tests required. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-10`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 5 new section files created
- `sections/index.ts` exports all 5 new sections
- Shell's SECTION_COMPONENTS includes: itinerary, meals_grid, included_excluded, difficulty, accommodation
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): tour itinerary sections — itinerary/meals/included/difficulty/accommodation`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
