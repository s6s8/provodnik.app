# Wave 1.3 — Regenerate TypeScript types + Zod schemas

## CONTEXT

You are working inside a git worktree of the Provodnik Next.js 15 app. **Your working directory (`.`) IS the app root.** Source lives under `src/`.

Wave 1.1 added columns and tables. Supabase's TypeScript generator produces a schema types file (path varies by project — find it). Zod schemas for form validation need to match the new columns. This wave brings both in sync.

**Repo conventions (non-negotiable):**
- Source: `src/`, path alias `@/*` → `./src/*`
- Package manager: `bun`
- Scripts: `bun run typecheck`, `bun run test:run <file>`
- **NEVER invoke `bunx vitest run` directly** — hangs inside cursor-agent shell on Windows (ERR-013). Use `bun run test:run <file>` or skip in-agent tests.

## SCOPE

**Branch:** `feat/tripster-v1/p1`
**Worktree:** current directory

**What you build:**
1. Regenerated Supabase types file (path TBD — find it in step 1)
2. Updated Zod schemas covering `listings`, `guide_profiles`, and the 23 new tables that will be used by forms

**Out of scope:**
- Zod schemas for tables that only get server-side usage (no form) — skip those
- Any runtime type changes in components (downstream waves)

## KNOWLEDGE (from SOT)

From PATTERNS.md:
- Zod schemas are colocated at `src/lib/zod/<entity>.ts` (or wherever the project currently puts them — discover the actual path first) and export both the schema and the inferred type.
- Form schemas use `z.object({...}).strict()` for draft validation.
- Nullable columns use `z.<type>().nullable()`, not `z.optional()`.

From ERRORS.md:
- ERR-014: when regenerating Supabase types, never hand-edit the generated file — always re-run the generator. Hand edits get lost.

## TASK

1. **Find the Supabase types file.** Run:
   ```
   find . \( -name "schema.ts" -path "*supabase*" -o -name "database.types.ts" \) -not -path "*/node_modules/*"
   ```
   Then use the Read tool to inspect `src/` for any `supabase/` subdirectory if the above returns nothing.
   Report the actual path before regenerating.

2. **Regenerate types** from local Supabase:
   ```
   bunx supabase gen types typescript --local > <actual-path-from-step-1>
   ```

3. **Verify:** `grep -n "exp_type" <actual-path>` — expected: at least one hit inside a `listings` row/insert/update type.

4. **Find existing Zod schemas:**
   ```
   find src -type d -name zod 2>/dev/null
   find src -name "*.zod.ts" 2>/dev/null
   ```
   Report the location convention.

5. **Update `listings` Zod schema** to include the 25 new fields. Keep existing fields intact. Example additions:
   ```ts
   exp_type: z.enum(['excursion','waterwalk','masterclass','photosession','quest','activity','tour','transfer']).nullable(),
   format: z.enum(['group','private','combo']).nullable(),
   movement_type: z.string().nullable(),
   languages: z.array(z.string()).default([]),
   currencies: z.array(z.string()).default(['RUB']),
   idea: z.string().nullable(),
   route: z.string().nullable(),
   theme: z.string().nullable(),
   audience: z.string().nullable(),
   facts: z.string().nullable(),
   org_details: z.record(z.any()).nullable(),
   difficulty_level: z.enum(['easy','medium','hard','extreme']).nullable(),
   included: z.array(z.string()).default([]),
   not_included: z.array(z.string()).default([]),
   accommodation: z.record(z.any()).nullable(),
   deposit_rate: z.number().min(0).max(1).default(0),
   pickup_point_text: z.string().nullable(),
   dropoff_point_text: z.string().nullable(),
   vehicle_type: z.string().nullable(),
   baggage_allowance: z.string().nullable(),
   pii_gate_rate: z.number().min(0).max(1).default(0.60),
   booking_cutoff_hours: z.number().int().default(24),
   event_span_hours: z.number().int().nullable(),
   instant_booking: z.boolean().default(false),
   average_rating: z.number().min(0).max(5).default(0),
   review_count: z.number().int().default(0),
   status: z.enum(['draft','pending_review','active','rejected','archived']).default('draft'),
   ```

6. **Update `guide_profiles` Zod schema** with the 13 new fields.

7. **Create new Zod schemas** for form-bound new tables (at minimum):
   - `listing_days.ts`
   - `listing_meals.ts`
   - `listing_tour_departures.ts`
   - `listing_tariffs.ts`
   - `review_replies.ts`

8. **Typecheck:** `bun run typecheck` — expected: no errors in the zod directory or regenerated types file.

9. **Commit:** Replace `<types-path>` with the actual path found in step 1, and `<zod-dir>` with the actual directory found in step 4:
   ```
   git add <types-path> <zod-dir>
   git commit -m "feat(types): regenerate Supabase types + Zod schemas for tripster v1"
   git tag checkpoint/tripster-v1-phase-1-schema-green
   ```

## INVESTIGATION RULE

Report the actual paths for the Supabase types file and the Zod directory before writing anything. Do not assume any specific location — discover it. Common candidates: `src/lib/supabase/schema.ts`, `src/types/supabase.ts`, `src/lib/database.types.ts`.

## TDD CONTRACT

This is a type-level wave. Validation happens via:
- `bun run typecheck` must pass
- New Zod schemas should each have a minimal happy-path test colocated next to source as `*.test.ts`
- **Do NOT invoke `bunx vitest run`** (ERR-013). Orchestrator verifies tests externally.

## ENVIRONMENT

- **Working directory:** the worktree root (current dir). Treat `.` as the app root.
- **Package manager:** `bun`
- **Supabase CLI:** available via `bunx supabase`
- **Typecheck:** `bun run typecheck`
- **FORBIDDEN commands:** `bunx vitest run`, `bunx vitest`, `npx vitest` — all hang per ERR-013

## DONE CRITERIA

- Supabase types file regenerated and contains `exp_type`, `difficulty_level`, and other new columns
- `listings` + `guide_profiles` Zod schemas updated
- At least 5 new Zod schemas for form-bound new tables
- `bunx tsc --noEmit` clean
- All existing tests still pass
- Commit + tag `checkpoint/tripster-v1-phase-1-schema-green`
- Out-of-scope files untouched
