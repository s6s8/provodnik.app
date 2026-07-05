# PRD-004 — Migration ledger inventory & reconciliation

Date: 2026-07-05 (UTC+3). Author: full-completion pass. Project: `provodnik`
(Supabase ref `yjzpshutgmhxizosbeef`). No secrets in this file.

## TL;DR — the drift is a **truncated ledger**, not 91 pending migrations

- The live `supabase_migrations.schema_migrations` ledger holds **12** rows.
- The repo has **94** migration versions on disk.
- The live schema is **fully built** — every table/policy/function referenced by
  the app exists and was spot-verified (e.g. `traveler_requests`, `guide_profiles`,
  `listings`, `listing_inclusions`, `referral_program_config`, `is_admin()`,
  RLS on all public tables). So the ~91 "unapplied" repo migrations were in fact
  **already applied historically**; the ledger was truncated/restored around
  2026-07-02, losing the pre-2026-07-02 history.

**Consequence (do NOT ignore):** `supabase db push` is unsafe. It would attempt
to run the "unapplied" files against an already-built schema — including
`20260401000000_drop_all.sql`, which drops everything. **Never run `db push`
against this project until the ledger is reconciled to the full history in a
controlled maintenance window.** Apply individual migrations only via targeted
SQL after introspecting the live schema (the method used in this pass).

## What this pass changed on the live DB

| Action | Version | Result |
|---|---|---|
| Applied anon public-catalog SELECT policy body (PRD-002) | `20260609000001` | `traveler_requests_select` now exposes `status='open'` to anon; ledger row inserted (repair) |
| New migration: tighten public reads (PRD-033) | `20260705193000` | `listing_inclusions` gated on parent visibility; `referral_program_config` → admin-only; ledger row inserted |

Both ledger rows were inserted with empty `statements` (`'{}'`), matching what
`supabase migration repair --status applied` records. The Supabase CLI DB
password was not available in this environment, so `migration repair` was
performed via the Management API `database/query` endpoint (equivalent effect:
a row in `supabase_migrations.schema_migrations`).

## Ledger after this pass (12 rows)

```
20260609000001  public_catalog_anon_access            (repaired this pass)
20260702000000  refreeze_search_guides_after_guide_type
20260702000001  publish_approved_guides
20260702143000  enforce_active_account_for_guide_offers
20260702170000  filter_public_guides_by_account_state
20260703000000  public_guide_detail_rpc
20260703000100  harden_public_traveler_requests
20260703001000  constrain_business_leads_insert
20260703001100  seed_storage_buckets
20260703001200  restrict_request_metrics_rpcs
20260703001300  allow_counter_offer_replacement
20260705193000  tighten_public_reads_inclusions_referral  (new this pass)
```

## Applied-but-not-in-repo (9 versions — informational)

These were applied directly to live (hotfixes around the 2026-07-02/03 window)
and have **no matching file in `supabase/migrations/`**. Their effects are live.
Back-fill the SQL files from live definitions when convenient (not blocking):

```
20260702000000 20260702143000 20260702170000
20260703000000 20260703000100 20260703001000
20260703001100 20260703001200 20260703001300
```

## Deliberately UNAPPLIED — keep it that way

- `20260528154254_drop_guide_display_name.sql` — **must not be applied.**
  `guide_profiles.display_name` still exists on live and is the anon-visible
  source of guide names (anon cannot read `profiles` under RLS; code falls back
  to `display_name` in `queries/core.ts` and `listings/[id]/page.tsx`). Applying
  the drop now would blank guide names and break listing-detail. Prerequisite
  before it can ever run: migrate all public name reads to
  `v_guide_public_profile.full_name`.

## Recommended full reconciliation (owner-scheduled maintenance window)

1. Snapshot the DB (Supabase automated backup / PITR checkpoint).
2. For each of the 91 repo versions missing from the ledger, confirm its objects
   exist in live via `information_schema` / `pg_policies` / `pg_proc`
   introspection, then `supabase migration repair --status applied <version>`
   (or an equivalent ledger insert). Do this per-version, not in bulk, so a
   genuinely-missing migration is caught rather than silently marked applied.
3. Back-fill the 9 applied-not-in-repo files from live definitions.
4. Only after the ledger equals the live schema, re-enable `db push` for future
   migrations.

Until step 4, every migration ships the way this pass shipped PRD-002 and
PRD-033: targeted SQL + `pg_policies`/introspection verification + anon REST
probe + a ledger repair row.
