# Phase 4.12 — ListingEditorV1: tour departures + publish gate

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-12`
**Branch:** `feat/tripster-v1-p4-12`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite (4.1–4.11 already merged):**
All shared leaves and tour sections exist. This wave adds the final tour sections: departures + transfer pickup/dropoff + vehicle/baggage.

**Section contract:**
```ts
interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}
```

**Relevant types:**
```ts
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

export type ListingRow = {
  id: string;
  guide_id: string;
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  vehicle_type: string | null;
  baggage_allowance: string | null;
  // ...full ListingRow
};
```

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**shadcn/ui:** Button, Input, Label, Badge, Card, Select, Separator, Skeleton, Alert

## SCOPE

**Note:** `PickupDropoffSection` and `VehicleBaggageSection` were created in wave 4.9. This wave only adds `DeparturesSection`.

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/sections/DeparturesSection.tsx`

**Modify:**
2. `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — add DeparturesSection export
3. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — add `departures: DeparturesSection` to SECTION_COMPONENTS

**DO NOT touch:** any other existing files.

## TASK

### 1. DeparturesSection (direct Supabase, SectionKey="departures")

Fixed tour departure dates using `listing_tour_departures`.

- Fetch on mount: `supabase.from("listing_tour_departures").select("*").eq("listing_id", listing.id).order("start_date", { ascending: true })`
- Display as list of cards:
  - start_date → end_date range
  - price (price_minor ÷ 100 rubles)
  - max_persons participants
  - status badge (active=green, cancelled=muted, sold_out=yellow)
  - Delete button (sets status="cancelled", does NOT delete row)
- "Добавить отправление" form:
  - start_date: date input (required)
  - end_date: date input (required, must be ≥ start_date)
  - price_minor: number input (enter rubles, ×100 to store)
  - max_persons: number input (default 1)
  - Insert: `supabase.from("listing_tour_departures").insert({ listing_id: listing.id, start_date, end_date, price_minor, currency: "RUB", max_persons, status: "active" })`
- Tour-operator gate:
  - If `listing.exp_type === "tour"` and there are no departures with status="active", show an Alert:
    "Для туров требуется хотя бы одна активная дата отправления"
- Deposit field (behind feature flag — do NOT implement, leave commented):
  ```tsx
  {/* FEATURE_DEPOSITS: deposit_rate field — hidden until payments land */}
  ```

## INVESTIGATION RULE

Before writing, read:
- `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — current exports
- `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — SECTION_COMPONENTS map
- `src/features/guide/components/listings/ListingEditorV1/sections/BasicsSection.tsx` — SectionProps
- `src/lib/supabase/types.ts` — confirm ListingTourDepartureRow

## TDD CONTRACT

No unit tests required. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-12`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- DeparturesSection.tsx created
- `sections/index.ts` exports DeparturesSection
- Shell's SECTION_COMPONENTS includes departures
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): tour departures section + deposit field stub`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
