# Wave 1.2 — Schema rollback script + staging dry-run

## CONTEXT

You are working inside a git worktree of the Provodnik Next.js 15 app. **Your working directory (`.`) IS the app root.** Source lives under `src/`. Migrations live under `supabase/migrations/`.

Wave 1.1 has just landed `20260413000001_tripster_v1.sql`, adding 38 columns, 23 tables, 5 views, and RLS policies. This wave writes the reverse migration that fully undoes it so we can roll back if Phase 4+ discover a schema issue.

**Repo conventions (non-negotiable):**
- Migrations under `supabase/migrations/`, timestamped UTC, no transaction wrapper
- Package manager: `bun`
- Scripts: `bun run db:reset`, `bun run db:diff`, `bun run typecheck`
- **NEVER invoke `bunx vitest run` directly** — hangs inside cursor-agent shell on Windows (ERR-013)

## SCOPE

**Branch:** `feat/tripster-v1/p1`
**Worktree:** current directory (same as Wave 1.1)

**What you build:**
1. `supabase/migrations/20260413000001_tripster_v1_rollback.sql` — reverse migration
2. A verified dry-run showing forward → rollback returns schema to baseline

**Out of scope:**
- Automated test for rollback in CI (manual verification is enough for v1)
- Rollback triggers for subsequent migrations (each gets its own when written)

## KNOWLEDGE (from SOT)

From ANTI_PATTERNS.md:
- AP-007: never use `drop ... cascade` in a forward migration. Rollback is the exception — cascade drops are allowed here because we're undoing.
- AP-011: always drop in reverse dependency order. Child tables before parents.

From PATTERNS.md:
- Rollback SQL files are named `<timestamp>_<name>_rollback.sql` and live next to the forward migration.
- Supabase will not automatically run rollback files — they're manual operator tools.

## TASK

1. **Read** `20260413000001_tripster_v1.sql` line by line to extract the exact column and table names.
2. **Write** `supabase/migrations/20260413000001_tripster_v1_rollback.sql` in this order:

   a. `drop view if exists public.v_guide_dashboard_kpi cascade;`
      `drop view if exists public.v_guide_public_profile cascade;`
      `drop view if exists public.v_listing_detail_tour cascade;`
      `drop view if exists public.v_listing_detail_excursion cascade;`
      `drop view if exists public.v_listing_card cascade;`

   b. `drop table if exists` for all 23 new tables in **reverse dependency order** (children first). Example order:
      - dispute_events, disputes
      - partner_payouts_ledger, partner_accounts
      - help_articles
      - bonus_ledger, referral_redemptions, referral_codes
      - notifications
      - favorites_items, favorites_folders
      - review_replies, review_ratings_breakdown
      - listing_videos, listing_photos, listing_licenses
      - listing_schedule_extras, listing_schedule
      - listing_tariffs, listing_tour_departures
      - listing_meals, listing_days

   c. `alter table guide_profiles drop column if exists <col>;` for all 13 additive columns
   d. `alter table listings drop column if exists <col>;` for all 25 additive columns

3. **Dry-run verification:**
   ```
   bun run db:reset                                           # applies all migrations including 1.1
   bunx supabase db psql -f supabase/migrations/20260413000001_tripster_v1_rollback.sql
   # Now confirm schema matches pre-tripster baseline:
   bunx supabase db psql -c "\d listings" > /tmp/listings-after-rollback.txt
   # Compare against a baseline captured before migration 1.1 was applied
   ```

   If the rollback leaves any artifact behind (stale FK, orphan index, etc.), fix the SQL and re-run until clean.

4. **Commit:**
   ```
   git add supabase/migrations/20260413000001_tripster_v1_rollback.sql
   git commit -m "feat(db): tripster v1 rollback script (verified against local)"
   ```

## INVESTIGATION RULE

Read `20260413000001_tripster_v1.sql` in full before writing the rollback. The reverse order matters — dispute_events must be dropped before disputes, favorites_items before favorites_folders, and so on.

## ENVIRONMENT

- **Working directory:** the worktree root (current dir). Treat `.` as the app root.
- **Local Supabase:** running. Config in `supabase/config.toml`.
- **Package manager:** `bun`
- **Scripts:** `bun run db:reset`, `bun run db:diff`
- **FORBIDDEN commands:** `bunx vitest run` (ERR-013 — hangs in cursor-agent shell)
- **psql access:** `bunx supabase db psql` or direct `psql` on port 54322

## DONE CRITERIA

- `20260413000001_tripster_v1_rollback.sql` exists
- Forward migration then rollback leaves the DB in the same shape as pre-forward
- `\d listings` after rollback does NOT show any of the 25 new columns
- `\dt public.listing_days` returns "no matching relations found"
- Commit on `feat/tripster-v1/p1` with the message above
- Out-of-scope files untouched
