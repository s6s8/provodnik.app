# TYPE: MIGRATION

You are executing one MIGRATION row. This produces ONE commit that
contains:
- A new SQL migration file under `provodnik.app/supabase/migrations/`
- Regenerated TypeScript types at `provodnik.app/src/lib/supabase/types.ts`

You apply the SQL via Supabase MCP plugin (NOT cursor-agent). Project ID:
`yjzpshutgmhxizosbeef`.

## Recipe

1. Read your row's `title`, `file/scope hint`, and `verify:` clause.
2. Read the parent plan section for the row's task (e.g., Plan 50 T1 lives
   at `docs/superpowers/plans/...launch-readiness-implementation.md` §3.1).
3. Write the migration file at the exact path the row names (or the plan
   names). Filename: `YYYYMMDDHHMMSS_<short_slug>.sql`. Date is today UTC.
4. Apply the migration:
   ```
   mcp__plugin_supabase_supabase__apply_migration
     project_id: yjzpshutgmhxizosbeef
     name: <slug>
     query: <full SQL body>
   ```
   If MCP is not authenticated, call
   `mcp__plugin_supabase_supabase__authenticate` first; on success it
   returns a session and you proceed.
5. Verify the migration applied: run the SELECT from the row's `verify:`
   clause via `mcp__plugin_supabase_supabase__execute_sql`. The result
   must match what the row specifies.
6. Regenerate TypeScript types:
   ```
   cd provodnik.app && bun run db:types
   ```
   (If the script name differs, read `package.json` `scripts` to find the
   correct one. Common names: `db:types`, `gen:types`, `supabase:types`.)
7. Verify types updated: grep the regenerated file for the new column or
   table reference.
8. Stage both files: `git -C provodnik.app add supabase/migrations/<file> src/lib/supabase/types.ts`.
9. Commit with the message in the parent plan. Push.
10. Update ledger row to `[x]` with `commit:` = SHA, `evidence:` = the
    SELECT result snippet (e.g., `specializations | ARRAY | '{}' | NO`).
11. Exit 0.

## Self-healing

If step 4 returns an error like `column already exists`:
- Run the verify SELECT (step 5). If state matches what the migration would
  produce, treat as already-applied: skip step 4, continue from step 6.
- If state is partial (column exists but constraint missing), run only the
  missing pieces of the SQL via `execute_sql` and proceed.

If step 4 returns a syntax error:
- Read the error. Fix the SQL. Retry. Up to 3 attempts.
- If still failing after 3, mark `[!]` with full SQL + error.

If step 6 fails (script missing or fails):
- Look in `package.json` for any types-related script. If none exists, the
  type regeneration is not part of this project's flow — proceed without
  it (note in evidence: "no db:types script; types not regenerated").
- If a script exists but fails, mark `[!]` with output.

If step 7 (verify types) fails because regen didn't pick up the column:
- Re-run the regen.
- If still missing, mark `[!]` with diagnosis.

## Ledger update — exact format

Same shape as EDIT, with TYPE = MIGRATION and evidence containing the
verify SELECT result.
