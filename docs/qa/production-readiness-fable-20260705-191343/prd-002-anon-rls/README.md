# PRD-002 — apply public-catalog anon RLS to live DB (operator action)

**Status:** prepared, NOT applied. Claude Code performed code/artifact work only; the
live DB was not mutated (per dispatch safety rules).

## What's wrong
The `/requests` catalog is empty for logged-out visitors. The policy that makes
`status='open'` requests anon-visible lives in
`supabase/migrations/20260609000001_public_catalog_anon_access.sql` but was never
applied to the live DB (migration-drift class ERR-092). Verified in the audit by
an anon-key probe returning 0 rows while a qa-traveler saw an open request.

## Correctness review
The migration is correct. It is a `for select using(...)` policy with **no `to`
clause**, so it applies to every role including `anon`. The first OR branch
(`status = 'open'`) is unconditional on auth, so anonymous users gain read access
to exactly the open rows and nothing else. No write grants. No exposure of
draft/expired/closed rows.

## Apply steps (operator)
1. Open the Supabase SQL editor on the **production** project.
2. Run `VERIFY.sql` — record the BEFORE state (policy `qual`, `open_rows` count).
3. Run `APPLY.sql` (idempotent drop→create, wrapped in a transaction).
4. Run `VERIFY.sql` again — the SELECT policy `qual` must now contain a top-level
   `(status = 'open'::request_status)` branch; step 4's `anon_visible_open_rows`
   must equal step 3's `open_rows`.
5. Run the anon REST probe below — it must return the open request(s).

### Anon REST probe (read-only, no session)
```bash
# Uses the public anon key. Returns open rows iff the policy is applied.
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/traveler_requests?status=eq.open&select=id,status,open_to_join,starts_on" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
(Do not paste key values anywhere; read them from the environment.)

## ⚠️ Do NOT `supabase db push`
The ledger is out of sync with the live schema (PRD-004): e.g.
`20260528154254_drop_guide_display_name.sql` is unapplied and live guide names
still depend on `guide_profiles.display_name`. A blind push could run that drop
and blank every guide name. Apply this one policy by hand via SQL editor only.

## Ledger reconciliation (after apply)
Mark this migration applied via the CLI, not by raw INSERT into
`supabase_migrations` (unsafe — see the migration-drift HOT entry):
```bash
supabase migration repair --status applied 20260609000001
```
Do this as part of the PRD-004 ledger-repair window, not standalone, so the whole
inventory is reconciled at once.
