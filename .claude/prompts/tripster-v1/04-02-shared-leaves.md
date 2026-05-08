# Phase 4.2 — ListingEditorV1: shared section leaves

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-2`
**Branch:** `feat/tripster-v1-p4-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite (4.1 is already merged):**
`src/features/guide/components/listings/ListingEditorV1/` already exists with:
- `types.ts` — `SectionKey`, `EditorSection`, `ALL_SECTIONS`, `SECTIONS_BY_TYPE`
- `ListingEditorShell.tsx` — the shell component (you will modify this)
- `useAutosave.ts` — debounced autosave hook
- `index.ts` — barrel export

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
// returns SupabaseClient (browser)
```

**Relevant types from `src/lib/supabase/types.ts`:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  slug: string;
  title: string;
  region: string;
  city: string | null;
  category: string;
  description: string | null;
  duration_minutes: number | null;
  max_group_size: number;
  price_from_minor: number;
  currency: string;
  status: "draft" | "pending_review" | "active" | "rejected" | "archived";
  // Tripster v1 fields:
  exp_type: "excursion" | "waterwalk" | "masterclass" | "photosession" | "quest" | "activity" | "tour" | "transfer" | null;
  format: "group" | "private" | "combo" | null;
  movement_type: string | null;
  languages: string[];
  idea: string | null;
  route: string | null;
  theme: string | null;
  audience: string | null;
  facts: string | null;
  org_details: Record<string, unknown> | null;
  difficulty_level: "easy" | "medium" | "hard" | "extreme" | null;
  included: string[];
  not_included: string[];
  accommodation: Record<string, unknown> | null;
  deposit_rate: number;
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  vehicle_type: string | null;
  baggage_allowance: string | null;
  booking_cutoff_hours: number;
  event_span_hours: number | null;
  instant_booking: boolean;
  average_rating: number;
  review_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingPhotoRow = {
  id: string;
  listing_id: string;
  url: string;
  position: number;
  alt_text: string | null;
};

export type ListingScheduleRow = {
  id: string;
  listing_id: string;
  weekday: number | null; // 0=Mon…6=Sun
  time_start: string;     // "HH:MM"
  time_end: string;       // "HH:MM"
};

export type ListingScheduleExtraRow = {
  id: string;
  listing_id: string;
  date: string;         // "YYYY-MM-DD"
  time_start: string | null;
  time_end: string | null;
};

export type ListingTariffRow = {
  id: string;
  listing_id: string;
  label: string;
  price_minor: number;
  currency: string | null;
  min_persons: number | null;
  max_persons: number | null;
};
```

**shadcn/ui available:** Button, Input, Textarea, Label, Select, Badge, Card, Dialog, Sheet, Tooltip, Alert, Skeleton, Separator, Tabs, Toggle, Toggle-Group, Scroll-Area

## SCOPE

**Create these files:**
1. `src/features/guide/components/listings/ListingEditorV1/sections/BasicsSection.tsx`
2. `src/features/guide/components/listings/ListingEditorV1/sections/PhotosSection.tsx`
3. `src/features/guide/components/listings/ListingEditorV1/sections/ScheduleSection.tsx`
4. `src/features/guide/components/listings/ListingEditorV1/sections/TariffsSection.tsx`
5. `src/features/guide/components/listings/ListingEditorV1/sections/IdeaRouteThemeSection.tsx`
6. `src/features/guide/components/listings/ListingEditorV1/sections/AudienceFactsSection.tsx`
7. `src/features/guide/components/listings/ListingEditorV1/sections/OrgDetailsSection.tsx`
8. `src/features/guide/components/listings/ListingEditorV1/sections/MeetingPointSection.tsx`
9. `src/features/guide/components/listings/ListingEditorV1/sections/index.ts`

**Modify:**
10. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx`
    - Add `draft` state and `onChange` handler
    - Replace the placeholder `<div>Section: {activeSection}</div>` with actual section routing

**DO NOT touch:** types.ts, useAutosave.ts, index.ts (the barrel), any files outside ListingEditorV1/.

## KNOWLEDGE

### Section contract

All section components share this interface:
```ts
import type { ListingRow } from "@/lib/supabase/types";

export interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}
```

Sections that manage separate tables (photos, schedule, tariffs) fetch their own data using `listing.id` via `createSupabaseBrowserClient`. They do NOT update `ListingRow` via `onChange`; they call Supabase directly.

Sections that update listing row fields call `onChange(patch)`.

### Shell draft state and onChange

The shell needs to hold `draft` state. Modify `ListingEditorShell.tsx` to add:

```tsx
const [draft, setDraft] = useState<Partial<ListingRow>>({});

const handleChange = useCallback((patch: Partial<ListingRow>) => {
  setDraft(prev => ({ ...prev, ...patch }));
  save({ ...draft, ...patch });
}, [draft, save]);
```

Then pass `listing={listing} draft={draft} onChange={handleChange} userId={userId}` to the active section.

### SECTION_COMPONENTS map

In the shell, after imports:
```tsx
import type { ComponentType } from "react";
import type { SectionProps } from "./sections";
import {
  BasicsSection, PhotosSection, ScheduleSection, TariffsSection,
  IdeaRouteThemeSection, AudienceFactsSection, OrgDetailsSection, MeetingPointSection,
} from "./sections";

const SECTION_COMPONENTS: Partial<Record<SectionKey, ComponentType<SectionProps>>> = {
  basics: BasicsSection,
  photos: PhotosSection,
  schedule: ScheduleSection,
  tariffs: TariffsSection,
  idea_route_theme: IdeaRouteThemeSection,
  audience_facts: AudienceFactsSection,
  org_details: OrgDetailsSection,
  meeting_point: MeetingPointSection,
};
```

In the main content area:
```tsx
const ActiveSection = SECTION_COMPONENTS[activeSection];
// Render:
{ActiveSection ? (
  <ActiveSection listing={listing} draft={draft} onChange={handleChange} userId={userId} />
) : (
  <div className="p-8 text-sm text-muted-foreground">
    Раздел «{ALL_SECTIONS[activeSection]?.label}» в разработке
  </div>
)}
```

### Russian strings for section UI

Weekdays (Mon=0, Sun=6):
- 0 → "Пн", 1 → "Вт", 2 → "Ср", 3 → "Чт", 4 → "Пт", 5 → "Сб", 6 → "Вс"

Format options:
- "group" → "Групповой"
- "private" → "Индивидуальный"
- "combo" → "Групповой или индивидуальный"

Difficulty levels:
- "easy" → "Лёгкий", "medium" → "Средний", "hard" → "Сложный", "extreme" → "Экстремальный"

Meal types (for future reference):
- "breakfast" → "Завтрак", "lunch" → "Обед", "dinner" → "Ужин"

### Per-section specs

**1. BasicsSection** (updates ListingRow via onChange)
Fields:
- `title` — Input, required
- `description` — Textarea, required, min 100 chars hint
- `region` — Input, required
- `city` — Input, optional
- `format` — Select (group/private/combo), required for non-null exp_type
- `languages` — comma-separated Input (display as "[Русский, English]"), store as string[]
- `movement_type` — Input optional ("Пешком", "На велосипеде", etc.)
- `max_group_size` — number Input min=1
- `duration_minutes` — number Input min=15, step=15 (show as hours/minutes)
- `booking_cutoff_hours` — number Input min=0 (hours before event)
- `instant_booking` — Toggle ("Мгновенное бронирование")
- `price_from_minor` — number Input, show as rubles (divide/multiply by 100)

Every field calls `onChange({ fieldName: value })` on blur/change.

**2. PhotosSection** (direct Supabase, does NOT use onChange)
- On mount: fetch `listing_photos` where `listing_id = listing.id` order by `position asc`
- Display as a grid of cards, each showing img + alt_text + delete button
- Add photo form: url Input + alt_text Input + "Добавить" button
  - On submit: `supabase.from("listing_photos").insert({ listing_id, url, alt_text, position: photos.length })`
  - Then refetch list
- Delete: `supabase.from("listing_photos").delete().eq("id", photo.id)`
- Cover sync: when photos change, take the `position=0` photo's url and call `onChange({ image_url: photos[0]?.url ?? null })`
  → This keeps `listings.image_url` in sync with the first photo
- Use Skeleton loading state while fetching

**3. ScheduleSection** (direct Supabase, does NOT use onChange)
Two sub-tabs: "Расписание" (weekly template) and "Особые даты" (one-off extras).

Weekly tab:
- Fetch `listing_schedule` where `listing_id = listing.id`
- Display as table with columns: Weekday, Начало, Конец, Удалить
- "Добавить слот" opens form: weekday select (Пн–Вс) + time_start + time_end inputs
  - Insert: `supabase.from("listing_schedule").insert({ listing_id, weekday, time_start, time_end })`
- Delete: `supabase.from("listing_schedule").delete().eq("id", row.id)`

Extras tab:
- Fetch `listing_schedule_extras` where `listing_id = listing.id` order by `date asc`
- Display: Date, Начало, Конец, Удалить
- "Добавить дату" form: date input + optional time_start + time_end
  - Insert: `supabase.from("listing_schedule_extras").insert({ listing_id, date, time_start, time_end })`
- Delete: `supabase.from("listing_schedule_extras").delete().eq("id", row.id)`

Use shadcn Tabs for the two sub-tabs.

**4. TariffsSection** (direct Supabase, does NOT use onChange)
- Fetch `listing_tariffs` where `listing_id = listing.id`
- Display as list of cards: label, price (÷100 = rubles), min/max persons, delete button
- "Добавить тариф" form:
  - label Input (e.g., "Взрослый", "Детский")
  - price_minor number Input (enter rubles, store as rubles×100)
  - min_persons number Input optional
  - max_persons number Input optional
  - Insert: `supabase.from("listing_tariffs").insert({ listing_id, label, price_minor, currency: "RUB", min_persons, max_persons })`
- Delete: `supabase.from("listing_tariffs").delete().eq("id", tariff.id)`
- Also update `listing.price_from_minor` via onChange with the minimum tariff price when tariffs change

**5. IdeaRouteThemeSection** (updates ListingRow via onChange)
Three Textarea fields:
- `idea` — label "Идея" (чем особенна эта экскурсия?)
- `route` — label "Маршрут" (опишите маршрут шаг за шагом)
- `theme` — label "Тема" (главная тема или концепция)
Each Textarea: rows=5, onChange calls `onChange({ idea/route/theme: value })` on blur.

**6. AudienceFactsSection** (updates ListingRow via onChange)
Two Textarea fields:
- `audience` — label "Аудитория" (кому подходит?)
- `facts` — label "Интересные факты"
Each Textarea: rows=4, onChange on blur.

**7. OrgDetailsSection** (updates ListingRow via onChange)
`org_details` is a `Record<string, unknown>` (jsonb). Implement as a dynamic key-value editor:
- Show existing keys as editable rows: [key Input] [value Input] [delete button]
- "Добавить поле" button adds a new empty row
- On any change, rebuild the full object and call `onChange({ org_details: newObj })`
Pre-populate known keys if org_details is null: no pre-population, start empty.
Common expected keys (show as placeholder text): "Место проведения", "Адрес", "Телефон зала"

**8. MeetingPointSection** (updates ListingRow via onChange)
Two Input fields:
- `pickup_point_text` — label "Точка встречи / начало" (full address or landmark)
- `dropoff_point_text` — label "Точка окончания / разъезд" (optional)
Each calls `onChange({ pickup_point_text: value })` / `onChange({ dropoff_point_text: value })` on blur.
Note: Map integration (Yandex Maps JS) is deferred — text inputs only in this wave.

### sections/index.ts

```ts
export { BasicsSection } from "./BasicsSection";
export { PhotosSection } from "./PhotosSection";
export { ScheduleSection } from "./ScheduleSection";
export { TariffsSection } from "./TariffsSection";
export { IdeaRouteThemeSection } from "./IdeaRouteThemeSection";
export { AudienceFactsSection } from "./AudienceFactsSection";
export { OrgDetailsSection } from "./OrgDetailsSection";
export { MeetingPointSection } from "./MeetingPointSection";
export type { SectionProps } from "./BasicsSection";
```

(Export `SectionProps` from whichever file defines it — define it in `BasicsSection.tsx` and re-export from index.)

## INVESTIGATION RULE

Before writing anything, read:
- `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — understand existing structure before modifying
- `src/features/guide/components/listings/ListingEditorV1/types.ts` — confirm SectionKey values
- `src/lib/supabase/types.ts` — confirm ListingRow, ListingPhotoRow, ListingScheduleRow, ListingScheduleExtraRow, ListingTariffRow shapes
- `src/lib/supabase/client.ts` — confirm browser client export name

Never assume. If an import doesn't exist, trace back and find the real one.

## TDD CONTRACT

No unit tests required for UI sections. TypeScript compile must pass (`bun run typecheck` exits 0).

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 9 new files created + ListingEditorShell.tsx modified
- All sections export from `sections/index.ts`
- Shell renders real sections (not placeholder) via SECTION_COMPONENTS map
- Shell has `draft` state and `handleChange` wired to autosave
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): ListingEditorV1 shared section leaves — basics/photos/schedule/tariffs/idea-route/audience/org/meeting`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
