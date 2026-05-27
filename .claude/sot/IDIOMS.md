# Provodnik codebase idioms

> Project-specific patterns the orchestrator inlines into every cursor-agent dispatch KNOWLEDGE block (same mechanism as HOT.md landmines).
>
> Each entry is one named idiom the codebase already uses. Cursor-agent has no MCP — every idiom that isn't here is an idiom cursor will guess at and probably guess wrong (see the E-32 T1 marathon — 8 fires to ship a 37-line additive change because cursor invented its own idioms).
>
> Add entries the moment a real cursor-agent dispatch invented a wrong idiom for something this codebase already does idiomatically.

---

## ID-001 — Additive migration: new Zod fields are .optional()

When extending an existing Zod schema (and its corresponding Row / Insert types) with a new field that older rows won't have, mark the field `.optional()`. This keeps construction sites that don't yet know about the new field type-correct.

```ts
// CORRECT
export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  badgeStrip: z.array(z.string()).optional(), // NEW — additive
});

// WRONG — every existing construct/insert site breaks until they all add badgeStrip
export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  badgeStrip: z.array(z.string()), // required
});
```

**Source of pain:** E-32 T1 (8 fires) — cursor wrote new fields as required; every consumer site broke; the resulting tsc errors triggered out-of-scope-ripple → VERIFY_DECIDE loop until ≤2 cap fired.

---

## ID-002 — z.enum from an `as const` array: spread to mutable

`z.enum([...])` wants a mutable tuple. A `readonly` tuple from `as const` is incompatible without a spread + cast to the explicit tuple type.

```ts
// CORRECT
export const SCOPE_MODES = ['all', 'selected'] as const;
type ScopeMode = (typeof SCOPE_MODES)[number];
const ScopeModeSchema = z.enum([...SCOPE_MODES] as [ScopeMode, ...ScopeMode[]]);

// WRONG — TS2345 readonly tuple cannot be assigned to mutable tuple
const ScopeModeSchema = z.enum(SCOPE_MODES as [ScopeMode, ...ScopeMode[]]);
```

**Source of pain:** E-32 T1 — cursor wrote the bare cast; TS error blocked the dispatch; over-edit attempt to fix touched the homepage form unrelatedly.

---

## ID-003 — react-hook-form: never hand-type the resolver

Use the inferred form-values type from the Zod schema; pass `zodResolver(schema)` as the resolver. Do NOT hand-type the resolver's generic parameter — the inference from `z.infer<typeof schema>` is canonical and propagates to every register/setValue call.

```ts
// CORRECT
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema } from '@/data/listings';

const form = useForm<z.infer<typeof listingSchema>>({
  resolver: zodResolver(listingSchema),
});

// WRONG — hand-typing the resolver hides inference and silently de-narrows defaultValues
const form = useForm<MyHandTypedShape>({
  resolver: zodResolver(listingSchema) as Resolver<MyHandTypedShape>,
});
```

**Source of pain:** E-32 T1 — cursor hand-typed the resolver shape; defaultValues silently lost narrowing; runtime form-state didn't match the schema.

---

## ID-004 — Money: `rubToKopecks` / `kopecksToRub`, never inline ×100/÷100

All rouble↔kopeck conversion goes through the brand-aware helpers in `src/data/money.ts`. Inline arithmetic (`amount * 100`, `amount / 100`) loses TypeScript brand discrimination AND breaks the no-inline-money rule (AP-012 / ERR-025 — tripped twice in production already).

```ts
// CORRECT
import { rubToKopecks, kopecksToRub } from '@/data/money';

const priceKopecks = rubToKopecks(rublesFromForm);     // Kopeks branded
const displayRub = kopecksToRub(priceKopecks);          // Rub branded

// WRONG — loses brand, trips ERR-025 / AP-012 (HOT.md landmine)
const priceKopecks = rublesFromForm * 100;
const displayRub = priceKopecks / 100;
```

**Source of pain:** prior incidents on the offer-creation flow (HOT.md AP-012). Rules block diff if reintroduced via 13-consistency landmine check.

---

## ID-005 — Multi-field form rows: flat N-column grid, optional marker in the label

When a section header (e.g. «Когда») introduces multiple peer fields that belong together (date + start time + end time, first name + last name + middle name, etc.), render the fields as siblings inside a single `sm:grid-cols-N` grid — NOT as a nested layout that pre-allocates horizontal space (`sm:grid-cols-2` outer with `grid-cols-2` inner).

Nested grids force each leaf cell into a fraction of a fraction of the form width; a label one character too long for that narrow cell will wrap, dropping its input below its siblings.

Optional/required markers go INSIDE the `<label>` text — `«Конец (необязательно)»`, not a sibling `<FieldHint>` below the input. Anything below the input adds variable cell height and breaks row alignment.

```tsx
// CORRECT — three peer fields, one flat grid, marker in the label
<div className="grid gap-2">
  <FieldLabel>Когда</FieldLabel>
  <div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-2">
    <div className="grid gap-2">
      <FieldLabel htmlFor="startDate">Дата</FieldLabel>
      <Input id="startDate" type="date" {...register("startDate")} />
      <FieldError id="startDate-error" message={errors.startDate?.message} />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="startTime">Начало</FieldLabel>
      <Input id="startTime" type="time" {...register("startTime")} />
      <FieldError id="startTime-error" message={errors.startTime?.message} />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="endTime">Конец (необязательно)</FieldLabel>
      <Input id="endTime" type="time" {...register("endTime")} />
      <FieldError id="endTime-error" message={errors.endTime?.message} />
    </div>
  </div>
</div>

// WRONG — nested grid pre-allocates each time cell to ~1/4 width;
// "Конец (необязательно)" wraps; Конец input drops below Начало
<div className="grid gap-5 sm:grid-cols-2">
  <div className="grid gap-2">
    <FieldLabel htmlFor="startDate">Дата</FieldLabel>
    <Input id="startDate" type="date" {...register("startDate")} />
  </div>
  <div className="grid grid-cols-2 gap-2">
    <div className="grid gap-2">
      <FieldLabel htmlFor="startTime">Начало</FieldLabel>
      <Input id="startTime" type="time" {...register("startTime")} />
    </div>
    <div className="grid gap-2">
      <FieldLabel htmlFor="endTime">Конец</FieldLabel>
      <Input id="endTime" type="time" placeholder="необязательно" {...register("endTime")} />
      <FieldHint>не обязательно</FieldHint>      {/* extra height — drifts row */}
    </div>
  </div>
</div>
```

**Rules:**
- One flat `sm:grid-cols-N` per row of peer fields. Mobile (no `sm:`) stacks vertically — no alignment problem to solve there.
- `sm:items-end` as defensive fallback: if any future label change (i18n, asterisk, new copy) pushes one cell to 2 lines, inputs still bottom-align across the row. Documented Tailwind pattern.
- Optional/required markers are part of the label text. WCAG/HSBC/Yale Dynamic Forms guidance — a sibling `FieldHint` or trailing paragraph is visually disconnectable and adds row-height variance.
- Each cell carries its own `<FieldError>` AFTER the input — error text adds height in only one cell at a time, the `items-end` keeps inputs aligned while the error renders below.
- Container width matters: at the form's actual rendered width, the longest label must fit on one line at `text-sm` inside an `N`-th-of-container cell. Mentally compute: `(formWidth - (N-1)*gap) / N` should comfortably exceed the longest label's pixel width. If marginal, the row will wrap unpredictably across browsers / font rendering.

**Source of pain:** ERR-100 — three pushes to fix the same Когда-row alignment, each fix moving the symptom to a new shape because the constraint (nested narrow cells) was never touched. See AP-040 for the meta-rule about diagnosing symptom-vs-source on layout regressions.
