# Phase 4.3 — ListingEditorV1: excursion branch

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-3`
**Branch:** `feat/tripster-v1-p4-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite (4.1 + 4.2 already merged):**
All shared section leaves exist:
- `src/features/guide/components/listings/ListingEditorV1/sections/` — BasicsSection, PhotosSection, ScheduleSection, TariffsSection, IdeaRouteThemeSection, AudienceFactsSection, OrgDetailsSection, MeetingPointSection

The shell renders sections via `SECTION_COMPONENTS` map. The section contract:
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
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // ...other fields
};
```

**shadcn/ui available:** Button, Input, Textarea, Label, Badge, Card, Alert

## SCOPE

The excursion branch is light: all sections for `exp_type="excursion"` are already implemented as shared leaves. The only new work is a **completeness check component** that shows what's missing before the guide can submit for review.

**SECTIONS_BY_TYPE["excursion"]:**
`["basics", "photos", "schedule", "tariffs", "idea_route_theme", "audience_facts", "meeting_point"]`

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/completeness/CompletenessPanel.tsx`
2. `src/features/guide/components/listings/ListingEditorV1/completeness/index.ts`

**Modify:**
3. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx`
   — Add `<CompletenessPanel>` below the section list in the sidebar

**DO NOT touch:** Any section files in `sections/`, types.ts, useAutosave.ts.

## TASK

### CompletenessPanel

Props:
```ts
interface Props {
  listing: ListingRow;
  draft: Partial<ListingRow>;
}
```

Merged view: `const merged = { ...listing, ...draft };`

For each section in `SECTIONS_BY_TYPE[listing.exp_type ?? "excursion"]`:
- Check if that section has enough data to be considered "complete"
- Show a check (✓ green) or a cross (✗ muted) next to the section label
- Show an overall "Ready to submit" / "Не готово к отправке" banner

Completeness rules per section:
```
basics:           merged.title && merged.title.length >= 3 && merged.region && merged.price_from_minor > 0
photos:           !!merged.image_url           (cover photo exists)
schedule:         true                          (always passes — schedule is optional)
tariffs:          merged.price_from_minor > 0  (at minimum price_from exists)
idea_route_theme: !!(merged.idea || merged.route || merged.theme)
audience_facts:   true                          (optional)
org_details:      true                          (optional)
meeting_point:    !!merged.pickup_point_text
included_excluded:true                          (optional)
difficulty:       !!merged.difficulty_level
accommodation:    true                          (optional)
itinerary:        true                          (optional)
meals_grid:       true                          (optional)
departures:       true                          (optional)
pickup_dropoff:   !!(merged.pickup_point_text && merged.dropoff_point_text)
vehicle_baggage:  !!merged.vehicle_type
```

UI:
- Small panel below section nav in sidebar
- Title: "Готовность"
- Each section in the listing's type: colored indicator + label
- If all required sections pass: green "Готово к отправке" banner
- If not: yellow "Нужно заполнить: [list of incomplete required sections]"

Required sections for each type (match SECTIONS_BY_TYPE but filter by whether the section actually gates publishing):
- basics, photos, meeting_point are always required
- For excursion/waterwalk: idea_route_theme is required
- tariffs is required (price must be > 0)
- All others are optional

Since the component needs `SECTIONS_BY_TYPE` and `ALL_SECTIONS`, import them from `../types`.

### Shell modification

In the sidebar, after the section nav list, add:
```tsx
<Separator className="my-4" />
<CompletenessPanel listing={listing} draft={draft} />
```

Import from `"./completeness"`.

## INVESTIGATION RULE

Before writing anything, read:
- `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — exact current structure
- `src/features/guide/components/listings/ListingEditorV1/types.ts` — SECTIONS_BY_TYPE and ALL_SECTIONS

Never assume. If a file doesn't match expectations, adapt.

## TDD CONTRACT

No unit tests required. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `completeness/CompletenessPanel.tsx` created
- `completeness/index.ts` barrel export created
- Shell sidebar shows completeness panel
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): completeness panel — per-section readiness check in sidebar`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
