# Phase 4.9 — ListingEditorV1: transfer branch sections

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-9`
**Branch:** `feat/tripster-v1-p4-9`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Bun.

**Prerequisite (4.1–4.8 already merged):**
All shared leaves exist. Transfer type uses:
`["basics", "photos", "tariffs", "pickup_dropoff", "vehicle_baggage", "meeting_point"]`

Of these, `basics`, `photos`, `tariffs`, `meeting_point` are shared leaves. This wave adds `pickup_dropoff` and `vehicle_baggage`.

**Section contract:**
```ts
interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}
```

Relevant ListingRow fields for transfer:
```ts
pickup_point_text: string | null;
dropoff_point_text: string | null;
vehicle_type: string | null;
baggage_allowance: string | null;
max_group_size: number;
```

**shadcn/ui:** Button, Input, Label, Textarea, Select, Separator

## SCOPE

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/sections/PickupDropoffSection.tsx`
2. `src/features/guide/components/listings/ListingEditorV1/sections/VehicleBaggageSection.tsx`

**Modify:**
3. `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — add exports
4. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx` — add to SECTION_COMPONENTS

**DO NOT touch:** any other existing files.

## TASK

### 1. PickupDropoffSection (SectionKey="pickup_dropoff")

Updates ListingRow via onChange.

Two Inputs:
- `pickup_point_text` — label "Место подачи" (exact address or landmark), required
- `dropoff_point_text` — label "Место назначения" (exact address or landmark), required

Both onBlur: `onChange({ pickup_point_text: value })` / `onChange({ dropoff_point_text: value })`

Info note: "Точные адреса видны путешественнику только после подтверждения бронирования"

### 2. VehicleBaggageSection (SectionKey="vehicle_baggage")

Updates ListingRow via onChange.

- `vehicle_type` — Select, label "Тип транспорта":
  - "" → "Выберите тип" (disabled placeholder)
  - "sedan" → "Седан"
  - "minivan" → "Минивэн"
  - "suv" → "Внедорожник"
  - "sprinter" → "Спринтер (микроавтобус)"
  - "bus" → "Автобус"
  - "boat" → "Лодка / катер"
  - "helicopter" → "Вертолёт"
  - "other" → "Другое"
  On change: `onChange({ vehicle_type: value })`

- `max_group_size` read-only display: "Вместимость: {merged.max_group_size} пас."
  (User edits capacity in BasicsSection; this just reflects it)

- `baggage_allowance` — Textarea rows=3, label "Условия перевозки багажа"
  (placeholder: "Например: до 20 кг в салоне, крупногабаритный багаж за доп. плату")
  onBlur: `onChange({ baggage_allowance: value })`

## INVESTIGATION RULE

Before writing, read:
- `src/features/guide/components/listings/ListingEditorV1/sections/index.ts`
- `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx`
- `src/features/guide/components/listings/ListingEditorV1/sections/BasicsSection.tsx` — SectionProps

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-9`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 2 section files created
- `sections/index.ts` exports both
- Shell SECTION_COMPONENTS includes pickup_dropoff, vehicle_baggage
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): transfer branch — pickup/dropoff + vehicle/baggage sections`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
