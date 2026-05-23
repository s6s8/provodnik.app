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
