---
name: supabase-migration
description: Full Supabase schema migration workflow — diff, create migration file, reset local DB, regenerate TypeScript types, commit
---

# Supabase Migration Workflow

Use when: adding a table, column, index, RLS policy, function, or trigger.

## The full sequence (never skip steps)

### 1. Write the SQL change
Edit the relevant file in `supabase/migrations/` OR let Codex generate it.
If generating via Codex — describe the change, Codex writes the SQL.

### 2. Diff against current local DB
```bash
cd D:\dev\projects\provodnik\provodnik.app
supabase db diff --schema public
```
Review the diff. If it matches intent, continue.

### 3. Create a named migration file
```bash
supabase migration new <descriptive-name>
# e.g. supabase migration new add_rls_to_listings
```
Paste the SQL into the created file.

### 4. Apply locally
```bash
supabase db reset
# This runs ALL migrations + supabase/seed.sql from scratch
# Confirms the migration is idempotent and applies cleanly
```

### 5. Regenerate TypeScript types
```bash
bun run types
# = supabase gen types typescript --local > src/types/supabase.ts
```
Always do this after any schema change. The type file is the contract between DB and app code.

### 6. Verify app still compiles
```bash
bun run build
```

### 7. Commit migration + types together
```bash
git add supabase/migrations/<new-file>.sql src/types/supabase.ts
git commit -m "feat(db): <description of schema change>"
```

## RLS policy pattern
Every new table needs RLS enabled + policies before any data can be read/written:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "owner_select" ON <table>
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_insert" ON <table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

Test policies in Supabase SQL editor:
```sql
SET role authenticated;
SET request.jwt.claims TO '{"sub": "<user-uuid>"}';
SELECT * FROM <table>; -- should only return that user's rows
```

## Never
- Never edit migration files that have already been applied to production
- Never skip type regeneration after schema changes
- Never apply migrations directly with raw SQL outside the migration system
