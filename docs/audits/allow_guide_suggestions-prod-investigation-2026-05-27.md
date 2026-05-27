# allow_guide_suggestions — prod schema investigation

**Date:** 2026-05-27  
**Item:** A2 (Wave 2 investigation)  
**Author:** claude-direct / provodnik-implement loop  

---

## Verdict

**column dropped** — `allow_guide_suggestions` was removed from the prod `traveler_requests` table on
2026-05-23 via migration `e63_drop_flexibility_columns_and_allow_guide_suggestions`
(prod version `20260523190821`).

---

## Investigation method

Read-only query against the linked Supabase project (`yjzpshutgmhxizosbeef`) via
`supabase db query --linked` (Management API, no schema mutation):

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'traveler_requests'
ORDER BY ordinal_position;
```

`allow_guide_suggestions` is **absent** from the result set.

NOTIFY pgrst / RELOAD SCHEMA was not needed — the column is confirmed gone, not a cache
artefact.

---

## Migration history reconstruction

| Prod version   | Name                                                     | Effect                                          |
|----------------|----------------------------------------------------------|-------------------------------------------------|
| 20260401→ (schema baseline) | `schema`                                  | Created `allow_guide_suggestions boolean not null default true` |
| 20260522111639 | `add_traveler_request_flex_flags`                        | Added `date_locked`, `time_locked`, `count_locked`, `budget_locked`, `date_window` |
| **20260523190821** | **`e63_drop_flexibility_columns_and_allow_guide_suggestions`** | **Dropped** `allow_guide_suggestions` + all 5 lock columns |

Drop migration SQL (fetched from `supabase_migrations.schema_migrations`):

```sql
-- E-63 — drop 6 columns from traveler_requests
ALTER TABLE traveler_requests
  DROP COLUMN IF EXISTS date_locked,
  DROP COLUMN IF EXISTS time_locked,
  DROP COLUMN IF EXISTS count_locked,
  DROP COLUMN IF EXISTS budget_locked,
  DROP COLUMN IF EXISTS date_window,
  DROP COLUMN IF EXISTS allow_guide_suggestions;
```

---

## Migration drift (CRITICAL)

The drop migration `20260523190821 / e63_drop_flexibility_columns_and_allow_guide_suggestions` **does
not exist** in the local `supabase/migrations/` folder.

Local folder has (latest three):

```
20260522151500_add_traveler_request_flex_flags.sql   ← adds the 5 lock cols
20260523000000_optimize_search_guides_rpc.sql        ← unapplied on prod
20260524013232_fix_listings_mojibake_bug1.sql        ← unapplied on prod
```

Consequence: if someone runs `supabase db push` from the local working tree today, Supabase
will try to apply `20260522151500` (add 5 lock cols) as a new migration — but those columns
already existed and were then dropped in prod.  The `IF EXISTS` / `IF NOT EXISTS` guards in
the local migration make it a no-op for the ADD, but the **local tree will never emit the
matching DROP**.  This leaves local and prod in a permanent schema fork unless the drop
migration file is backfilled.

---

## Current prod column state

Columns present in `traveler_requests` as of 2026-05-27:

```
id, traveler_id, destination, region, interests, starts_on, ends_on,
budget_minor, currency, participants_count, format_preference, notes,
open_to_join, group_capacity, status, created_at, updated_at,
start_time, end_time, date_flexibility
```

Columns confirmed ABSENT (all dropped by E-63):

- `allow_guide_suggestions`
- `date_locked`
- `time_locked`
- `count_locked`
- `budget_locked`
- `date_window`

`date_flexibility` is **present** — it was not dropped.

---

## Code risk

Multiple `SELECT` column lists in `src/` still reference `allow_guide_suggestions`:

| File | Lines | Risk |
|------|-------|------|
| `src/data/open-requests/supabase-client.ts` | 129, 258 | PostgREST 400 on every open-request list/detail fetch |
| `src/data/traveler-request/supabase-client.ts` | 66, 84 | PostgREST 400 on traveler-request detail fetch |
| `src/lib/supabase/requests.ts` | 121 (SELECT_COLS const) | Propagates to all callers |
| `src/app/(protected)/traveler/requests/[requestId]/page.tsx` | 25 | Same |
| `src/lib/supabase/types.ts` | 169 | Type definition (non-runtime, but misleads) |
| `src/lib/supabase/database.types.ts` | 2716, 2744, 2772 | Generated type (non-runtime) |

The INSERT path correctly omits the column (comment at `requests.ts:153-155`):
```ts
// form-epic #14: omit allow_guide_suggestions from insert; rely on
// DB column default. Closes bug 7 deterministically (prod schema-cache miss).
// allow_guide_suggestions: input.allow_guide_suggestions,
```
This is now moot — the column is gone — but the omission is still correct behaviour.

---

## Decision

**Option A — restore field:** ❌ Not warranted. The field was intentionally removed in E-63
after source code was confirmed to never branch on it.

**Option B — leave preventive + drop in C6:** ❌ Column is already dropped; C6 cleanup is
no longer a "drop now" but a "clean up dead references".

**Option C — drop now / clean up references:** ✅ **Chosen.**

Action plan:

1. **Backfill local drop migration** — create
   `supabase/migrations/20260523190821_e63_drop_flexibility_columns_and_allow_guide_suggestions.sql`
   with the SQL fetched above so the local folder matches prod history.  This is a docs/infra
   fix, not a schema change (idempotent DROP IF EXISTS).

2. **Remove dead SELECT references** — strip `allow_guide_suggestions` from all SELECT column
   strings and type definitions listed above.  This is a code change → cursor-dispatch item.
   Assign as follow-on to form-epic cleanup phase.

3. **date_flexibility dead-code check** — also check whether `date_flexibility` references in
   `src/data/traveler-request/supabase-client.ts:66,84` need similar treatment (column is
   still in prod so no runtime breakage, but worth auditing if E-32 replaced it).

---

## References

- Migration `e63_…` content fetched live from prod `supabase_migrations.schema_migrations`
- Schema query output: 20 columns confirmed, `allow_guide_suggestions` absent
- form-epic defect bug 7 comment: `src/lib/supabase/requests.ts:153-155`
- E-32 expand-contract comment: `supabase/migrations/20260522151500_add_traveler_request_flex_flags.sql:3-5`
