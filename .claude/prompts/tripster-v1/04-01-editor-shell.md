# Phase 4.1 — ListingEditor shell (Tripster v1)

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-1`
**Branch:** `feat/tripster-v1-p4-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Supabase (@supabase/ssr), Bun.

**Key existing files:**

Existing (legacy) listing editor — keep these unchanged:
- `src/features/guide/components/listings/listing-form.tsx` — old form (react-hook-form + Zod)
- `src/features/guide/components/listings/guide-listing-edit-page-client.tsx`
- `src/features/guide/components/listings/guide-listing-new-page-client.tsx`
- `src/app/(protected)/guide/listings/[id]/edit/page.tsx` — renders old editor
- `src/app/(protected)/guide/listings/new/page.tsx` — renders old editor

**Flag registry** (`src/lib/flags.ts`):
```ts
export const flags = {
  FEATURE_TRIPSTER_V1: bool("FEATURE_TRIPSTER_V1"),
  FEATURE_TRIPSTER_TOURS: bool("FEATURE_TRIPSTER_TOURS"),
  // ...
} as const;
export const isEnabled = (k: FlagName): boolean => flags[k];
```

**Supabase types** (relevant excerpt from `src/lib/supabase/types.ts`):
```ts
export type ListingExpType =
  | "excursion" | "waterwalk" | "masterclass" | "photosession"
  | "quest" | "activity" | "tour" | "transfer";

export interface ListingRow {
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
  status: string;
  // Tripster v1 fields:
  exp_type: ListingExpType | null;
  format: "group" | "private" | "combo" | null;
  movement_type: string | null;
  languages: string[] | null;
  idea: string | null;
  route: string | null;
  theme: string | null;
  audience: string | null;
  facts: string | null;
  org_details: string | null;
  difficulty_level: string | null;
  included: string[] | null;
  not_included: string[] | null;
  accommodation: string | null;
  deposit_rate: number | null;
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  vehicle_type: string | null;
  baggage_allowance: string | null;
  booking_cutoff_hours: number | null;
  event_span_hours: number | null;
  instant_booking: boolean | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
```

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
// returns SupabaseClient
```

**Route group:** `src/app/(protected)/guide/` — guide-facing pages with auth protection via layout

**shadcn/ui available:** Button, Input, Textarea, Label, Select, Badge, Card, Dialog, Sheet, Dropdown-Menu, Tooltip, Alert, Skeleton, Separator, Tabs, Progress, Toggle, Toggle-Group, Scroll-Area

## SCOPE

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/types.ts` — section types + SECTIONS_BY_TYPE map
2. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — shell + sidebar (client component)
3. `src/features/guide/components/listings/ListingEditorV1/useAutosave.ts` — debounced autosave hook
4. `src/features/guide/components/listings/ListingEditorV1/index.ts` — barrel export
5. `src/app/(protected)/guide/listings/new/page-v1.tsx` — new listing page gated by FEATURE_TRIPSTER_V1
6. `src/app/(protected)/guide/listings/[id]/edit/page-v1.tsx` — edit page gated by FEATURE_TRIPSTER_V1

**Modify:**
7. `src/app/(protected)/guide/listings/[id]/edit/page.tsx` — add flag check: if `FEATURE_TRIPSTER_V1`, render page-v1
8. `src/app/(protected)/guide/listings/new/page.tsx` — same flag check

**DO NOT touch:** listing-form.tsx, guide-listing-edit-page-client.tsx, guide-listing-new-page-client.tsx, types.ts, flags.ts, any migration files.

## KNOWLEDGE

**8 listing types and their sections:**

| exp_type | Required sections |
|---|---|
| excursion | basics, photos, schedule, tariffs, idea_route_theme, audience_facts, meeting_point |
| waterwalk | basics, photos, schedule, tariffs, idea_route_theme, audience_facts, meeting_point |
| masterclass | basics, photos, schedule, tariffs, org_details, audience_facts, meeting_point |
| photosession | basics, photos, schedule, tariffs, org_details, meeting_point |
| quest | basics, photos, schedule, tariffs, idea_route_theme, org_details, audience_facts, meeting_point |
| activity | basics, photos, schedule, tariffs, org_details, audience_facts, meeting_point |
| tour | basics, photos, itinerary, meals_grid, tariffs, included_excluded, difficulty, accommodation, departures, meeting_point |
| transfer | basics, photos, tariffs, pickup_dropoff, vehicle_baggage, meeting_point |

**Sidebar section labels (Russian):**
- basics → "Основное"
- photos → "Фото"
- schedule → "Расписание"
- tariffs → "Тарифы"
- idea_route_theme → "Идея / Маршрут / Тема"
- audience_facts → "Аудитория и факты"
- org_details → "Детали организации"
- included_excluded → "Включено / не включено"
- difficulty → "Сложность"
- accommodation → "Проживание"
- itinerary → "Программа"
- meals_grid → "Питание и транспорт"
- departures → "Даты отправления"
- pickup_dropoff → "Маршрут трансфера"
- vehicle_baggage → "Транспорт и багаж"
- meeting_point → "Точка встречи"

**Publish gate rules:**
- All required fields for the type must be non-empty
- Minimum: title, region, price_from_minor, exp_type, at least one photo (image_url), description
- Status transitions: `draft → pending_review` (guide submits), admin then moves to `active`

**Autosave:**
- Debounce 2000ms after last change
- PATCH to Supabase: `supabase.from("listings").update(patch).eq("id", listingId).eq("guide_id", userId)`
- Show "Сохранено" / "Сохранение..." indicator in header

## TASK

### 1. `src/features/guide/components/listings/ListingEditorV1/types.ts`

```ts
export type SectionKey =
  | "basics" | "photos" | "schedule" | "tariffs" | "idea_route_theme"
  | "audience_facts" | "org_details" | "included_excluded" | "difficulty"
  | "accommodation" | "itinerary" | "meals_grid" | "departures"
  | "pickup_dropoff" | "vehicle_baggage" | "meeting_point";

export interface EditorSection {
  key: SectionKey;
  label: string;
  /** True if this section must be complete before publishing */
  required: boolean;
}

export const ALL_SECTIONS: Record<SectionKey, EditorSection> = {
  basics:           { key: "basics",           label: "Основное",                required: true  },
  photos:           { key: "photos",           label: "Фото",                    required: true  },
  schedule:         { key: "schedule",         label: "Расписание",              required: false },
  tariffs:          { key: "tariffs",          label: "Тарифы",                  required: true  },
  idea_route_theme: { key: "idea_route_theme", label: "Идея / Маршрут / Тема",   required: false },
  audience_facts:   { key: "audience_facts",   label: "Аудитория и факты",       required: false },
  org_details:      { key: "org_details",      label: "Детали организации",      required: false },
  included_excluded:{ key: "included_excluded",label: "Включено / не включено",  required: false },
  difficulty:       { key: "difficulty",       label: "Сложность",               required: false },
  accommodation:    { key: "accommodation",    label: "Проживание",              required: false },
  itinerary:        { key: "itinerary",        label: "Программа",               required: false },
  meals_grid:       { key: "meals_grid",       label: "Питание и транспорт",     required: false },
  departures:       { key: "departures",       label: "Даты отправления",        required: false },
  pickup_dropoff:   { key: "pickup_dropoff",   label: "Маршрут трансфера",       required: false },
  vehicle_baggage:  { key: "vehicle_baggage",  label: "Транспорт и багаж",       required: false },
  meeting_point:    { key: "meeting_point",    label: "Точка встречи",           required: false },
};

import type { ListingExpType } from "@/lib/supabase/types";

export const SECTIONS_BY_TYPE: Record<ListingExpType, SectionKey[]> = {
  excursion:    ["basics","photos","schedule","tariffs","idea_route_theme","audience_facts","meeting_point"],
  waterwalk:    ["basics","photos","schedule","tariffs","idea_route_theme","audience_facts","meeting_point"],
  masterclass:  ["basics","photos","schedule","tariffs","org_details","audience_facts","meeting_point"],
  photosession: ["basics","photos","schedule","tariffs","org_details","meeting_point"],
  quest:        ["basics","photos","schedule","tariffs","idea_route_theme","org_details","audience_facts","meeting_point"],
  activity:     ["basics","photos","schedule","tariffs","org_details","audience_facts","meeting_point"],
  tour:         ["basics","photos","itinerary","meals_grid","tariffs","included_excluded","difficulty","accommodation","departures","meeting_point"],
  transfer:     ["basics","photos","tariffs","pickup_dropoff","vehicle_baggage","meeting_point"],
};
```

### 2. `src/features/guide/components/listings/ListingEditorV1/useAutosave.ts`

```ts
"use client";
import { useCallback, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/supabase/types";

type AutosaveState = "idle" | "saving" | "saved" | "error";

export function useAutosave(listingId: string, userId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<AutosaveState>("idle");
  const [state, setState] = useState<AutosaveState>("idle");

  const save = useCallback(async (patch: Partial<ListingRow>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setState("saving");
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("listings")
        .update(patch)
        .eq("id", listingId)
        .eq("guide_id", userId);
      setState(error ? "error" : "saved");
    }, 2000);
  }, [listingId, userId]);

  return { save, autosaveState: state };
}
```

Note: add `import { useState } from "react"` at top.

### 3. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx`

Client component. Props:
```ts
interface Props {
  listing: ListingRow;
  userId: string;
}
```

Layout:
- Two-column: fixed left sidebar (240px) + main content area
- Sidebar: title of listing at top, then list of `SECTIONS_BY_TYPE[listing.exp_type]` section links
- Active section highlighted
- Header bar: listing title (editable inline), autosave state badge ("Сохранено" / "Сохранение..." / "Ошибка сохранения"), "Отправить на проверку" button (only when publish gate passes)
- Main area: renders section content (use a placeholder `<div>Section: {activeSection}</div>` — subsequent waves fill each section)
- Publish gate: enabled when `listing.title && listing.price_from_minor > 0 && listing.image_url && listing.description`
- On "Отправить на проверку": call `supabase.from("listings").update({ status: "pending_review" }).eq("id", id)`

If `listing.exp_type` is null, show a type-picker step first (8 cards in a grid, one per type, with Russian labels).

**Russian type labels:**
- excursion → "Экскурсия"
- waterwalk → "Прогулка на воде"
- masterclass → "Мастер-класс"
- photosession → "Фотосессия"
- quest → "Квест"
- activity → "Активность"
- tour → "Тур"
- transfer → "Трансфер"

### 4. `src/features/guide/components/listings/ListingEditorV1/index.ts`

```ts
export { ListingEditorShell } from "./ListingEditorShell";
export { useAutosave } from "./useAutosave";
export { SECTIONS_BY_TYPE, ALL_SECTIONS } from "./types";
export type { SectionKey, EditorSection } from "./types";
```

### 5. `src/app/(protected)/guide/listings/new/page-v1.tsx`

Server component. Uses `createSupabaseServerClient`. Gets session. Creates a new draft listing with defaults:
```ts
const { data: listing } = await supabase.from("listings").insert({
  guide_id: userId,
  title: "Новый тур",
  slug: `draft-${Date.now()}`,
  region: "Не указан",
  category: "tour",
  price_from_minor: 0,
  currency: "RUB",
  status: "draft",
}).select().single();
```
Then redirects to `/guide/listings/${listing.id}/edit`.

### 6. `src/app/(protected)/guide/listings/[id]/edit/page-v1.tsx`

Server component. Fetches listing by id + userId. Renders `<ListingEditorShell listing={listing} userId={userId} />`.

### 7. Modify `src/app/(protected)/guide/listings/[id]/edit/page.tsx`

Add at top of the page server component:
```ts
import { flags } from "@/lib/flags";
// ... in the component body before the existing return:
if (flags.FEATURE_TRIPSTER_V1) {
  // dynamic import to avoid bundling legacy editor in v1 path
  const { default: PageV1 } = await import("./page-v1");
  return <PageV1 params={params} />;
}
```

### 8. Modify `src/app/(protected)/guide/listings/new/page.tsx`

Same pattern as #7 but for page-v1.tsx.

## INVESTIGATION RULE

Before writing anything, read:
- `src/lib/supabase/server.ts` — exact export name
- `src/lib/supabase/client.ts` — exact export name for browser client
- `src/lib/supabase/types.ts` — confirm ListingRow and ListingExpType shapes
- `src/lib/flags.ts` — confirm exact exports
- `src/app/(protected)/guide/listings/[id]/edit/page.tsx` — understand existing structure before modifying

Never assume. If an import doesn't exist, trace back and find the real one.

## TDD CONTRACT

No unit tests required for shell UI. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- All 8 files created/modified
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Type picker shows for new listings (exp_type null)
- Flag guard: `FEATURE_TRIPSTER_V1=0` renders legacy editor, `=1` renders new shell
- Commit: `feat(editor): ListingEditorV1 shell — type picker, sidebar, autosave, publish gate`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
