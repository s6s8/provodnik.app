---
name: provodnik-idioms
description: Use when editing any TypeScript or TSX in apps/provodnik/code — covers project-specific Zod, react-hook-form, and z.enum patterns that the codebase already uses (ID-001/ID-002/ID-003 from .claude/sot/IDIOMS.md). Read this before adding a new field to a Zod schema, before constructing a z.enum from an as-const array, or before wiring a react-hook-form resolver.
---

# Provodnik codebase idioms

These idioms are observed-in-codebase patterns. Following them means new code matches existing code mechanically. Deviating means the diff will fail typecheck or trigger consistency-rule escalations.

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