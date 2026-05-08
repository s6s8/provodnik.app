# Wave 1.1 — Schema megamigration: 20260413000001_tripster_v1.sql

## CONTEXT

You are working inside a git worktree of the Provodnik Next.js 15 app. **Your working directory (`.`) IS the app root.** Source lives under `src/`. Migrations live under `supabase/migrations/`.

Provodnik uses Supabase Postgres with `supabase/migrations/` timestamped SQL files. The existing `listings` table already has core columns (id, guide_id, title, description, price, image_url, etc.) from the pre-Tripster schema. This wave adds ~25 new columns to `listings`, ~13 new columns to `guide_profiles`, 23 new tables, 5 views, and full RLS policies.

**Repo conventions (non-negotiable):**
- Source: `src/`, path alias `@/*` → `./src/*`
- Package manager: `bun`
- Scripts: `bun run typecheck`, `bun run test:run <file>`, `bun run db:reset`, `bun run db:diff`
- **NEVER invoke `bunx vitest run` directly** — hangs inside cursor-agent shell on Windows (ERR-013)

Related docs:
- Spec: `docs/superpowers/specs/2026-04-12-tripster-v1-design.md` §3 (complete column list + table definitions)
- Plan: `docs/superpowers/plans/2026-04-12-tripster-v1.md` Phase 1 Wave 1.1

## SCOPE

**Branch:** `feat/tripster-v1/p1`
**Worktree:** `.claude/worktrees/tripster-v1/p1`

**What you build:**
1. `supabase/migrations/20260413000001_tripster_v1.sql` — the megamigration
2. Apply it against local Supabase to verify it runs clean

**Out of scope:**
- Rollback script (Wave 1.2)
- TypeScript type regeneration (Wave 1.3)
- Any seed data
- Any RLS policy changes to existing tables

## KNOWLEDGE (from SOT)

From ERRORS.md:
- Prior schema migrations that failed: always add `IF NOT EXISTS` / `IF EXISTS` clauses. Never assume the local DB is clean.
- PostGIS `geography(POINT, 4326)` is the canonical spatial type — not `geometry`.

From PATTERNS.md:
- Migration files follow the Supabase convention: single SQL file per change, timestamped UTC, no transaction wrapper (Supabase adds one).
- Enum columns use CHECK constraints, not PG native enums (for ease of migration).
- RLS policies: `create policy <name> on <table> for <op> to authenticated using (<clause>) with check (<clause>);`

From DECISIONS.md relevant entries:
- ADR-014: 8 listing types keyed by `exp_type` text column
- ADR-029: two detail templates, tour schema lives in separate tables
- ADR-032: 4-axis review ratings in `review_ratings_breakdown`
- ADR-034: dual aggregation, `listings.average_rating` + `guide_profiles.average_rating`

From ANTI_PATTERNS.md:
- AP-003: never store structured data in `description` text column. Tour itinerary goes in `listing_days`, not description.
- AP-007: never use `drop ... cascade` in a forward migration. Use additive columns only.

## TASK

Read the spec §3.1–§3.5 for the exact column list. Do NOT paraphrase — use the exact column names, types, and check constraints from the spec.

1. **Read** `supabase/migrations/` to see the existing migration naming and a recent one for style reference.
2. **Read** `docs/superpowers/specs/2026-04-12-tripster-v1-design.md` §3 fully.
3. **Write** `supabase/migrations/20260413000001_tripster_v1.sql` containing, in this order:

   a. **`listings` ALTER TABLE block** — all 25 columns from spec §3.1, each with `ADD COLUMN IF NOT EXISTS`
   b. **`guide_profiles` ALTER TABLE block** — all 13 columns from spec §3.2
   c. **15 CREATE TABLE IF NOT EXISTS blocks** per spec §3.3:
      - `listing_days(listing_id uuid references listings(id) on delete cascade, day_number smallint, title text, body text, date_override date, primary key (listing_id, day_number))`
      - `listing_meals(listing_id uuid references listings(id) on delete cascade, day_number smallint, meal_type text check (meal_type in ('breakfast','lunch','dinner')), status text check (status in ('included','paid_extra','not_included')), note text, primary key (listing_id, day_number, meal_type))`
      - `listing_tour_departures(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, start_date date not null, end_date date not null, price_minor int not null, currency text not null default 'RUB', max_persons smallint not null, status text not null default 'open')`
      - `listing_tariffs(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, label text not null, price_minor int not null, currency text default 'RUB', min_persons smallint, max_persons smallint)`
      - `listing_schedule(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, weekday smallint check (weekday between 0 and 6), time_start time not null, time_end time not null)`
      - `listing_schedule_extras(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, date date not null, time_start time, time_end time)`
      - `listing_licenses(listing_id uuid references listings(id) on delete cascade, license_id uuid, scope text, primary key (listing_id, license_id))`
      - `listing_photos(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, url text not null, position int default 0, alt_text text)`
      - `listing_videos(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, url text not null, poster_url text, position int default 0)`
      - `review_ratings_breakdown(review_id uuid, axis text check (axis in ('material','engagement','knowledge','route')), score smallint check (score between 1 and 5), primary key (review_id, axis))`
      - `review_replies(id uuid primary key default gen_random_uuid(), review_id uuid, guide_id uuid, body text not null, status text check (status in ('draft','pending_review','published')) default 'draft', submitted_at timestamptz, published_at timestamptz)`
      - `favorites_folders(id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, position int default 0)`
      - `favorites_items(folder_id uuid references favorites_folders(id) on delete cascade, listing_id uuid references listings(id) on delete cascade, added_at timestamptz default now(), primary key (folder_id, listing_id))`
      - `notifications(id uuid primary key default gen_random_uuid(), user_id uuid not null, event_type text not null, payload jsonb, channel text check (channel in ('inbox','email','telegram','push')), status text check (status in ('pending','sent','failed','read')) default 'pending', created_at timestamptz default now(), read_at timestamptz)`
      - `referral_codes(id uuid primary key default gen_random_uuid(), user_id uuid not null, code text unique not null, created_at timestamptz default now())`
      - `referral_redemptions(code_id uuid references referral_codes(id) on delete cascade, redeemed_by uuid not null, redeemed_at timestamptz default now(), primary key (code_id, redeemed_by))`
      - `bonus_ledger(id uuid primary key default gen_random_uuid(), user_id uuid not null, delta int not null, reason text, ref_id uuid, created_at timestamptz default now())`
      - `help_articles(id uuid primary key default gen_random_uuid(), slug text unique not null, category text, title text not null, body_md text not null, position int default 0)`
      - `partner_accounts(id uuid primary key default gen_random_uuid(), user_id uuid unique not null, api_token_hash text not null, created_at timestamptz default now())`
      - `partner_payouts_ledger(id uuid primary key default gen_random_uuid(), partner_id uuid references partner_accounts(id) on delete cascade, delta int not null, ref_id uuid, created_at timestamptz default now())`
      - `disputes(id uuid primary key default gen_random_uuid(), booking_id uuid, opened_by uuid, status text check (status in ('open','investigating','resolved','closed')) default 'open', resolution text, opened_at timestamptz default now(), resolved_at timestamptz)`
      - `dispute_events(id uuid primary key default gen_random_uuid(), dispute_id uuid references disputes(id) on delete cascade, actor_id uuid, event_type text, payload jsonb, created_at timestamptz default now())`

   Count: that's 23 tables — the plan said 15 because some spec §3.3 bullets bundle multiple tables. Ship all of them.

   d. **5 CREATE OR REPLACE VIEW blocks:**
      - `v_listing_card` — select `id, title, image_url, exp_type, format, languages, average_rating, review_count, price`
      - `v_listing_detail_excursion` — joins `listings` + `listing_schedule` + `listing_tariffs` + `listing_photos`
      - `v_listing_detail_tour` — joins `listings` + `listing_days` + `listing_meals` + `listing_tour_departures` + `listing_photos`
      - `v_guide_public_profile` — joins `guide_profiles` with rating aggregates
      - `v_guide_dashboard_kpi` — aggregates views/requests/offers/bookings per guide (placeholder, data sources may change during Phase 9)

   e. **RLS policies** for all 23 new tables following the existing `listings` policy shape. At minimum:
      - `enable row level security` on each table
      - Public `select` for active/published rows where appropriate
      - Owner-only `insert`/`update`/`delete` keyed on `auth.uid()`
      - Admin override where `(auth.jwt() ->> 'role') = 'admin'`

4. **Apply the migration locally:**
   ```
   bun run db:reset
   ```
   Expected: clean apply with no errors. If any column name conflicts with existing state, STOP and report — do not edit the existing schema.

5. **Commit:**
   ```
   git add supabase/migrations/20260413000001_tripster_v1.sql
   git commit -m "feat(db): tripster v1 megamigration — 23 new tables, 38 additive columns, 5 views, RLS"
   ```

## INVESTIGATION RULE

Before writing any SQL, **read the entire contents** of:
- `supabase/migrations/` (list all files, read the 3 most recent to learn the style)
- One existing RLS policy block from the repo for reference

The spec §3 content is reproduced above in the TASK block — you do NOT have access to the `docs/` directory (it lives in the outer workspace, not inside this worktree). Work from the TASK block alone.

If the repo uses `public.` schema prefixes, match that convention. If not, omit prefixes.

## TDD CONTRACT

Schema migrations are tested by applying and verifying. After writing the SQL:
1. Run `bun run db:reset` — must succeed
2. Run `bun run db:diff` — expected: no drift beyond the new schema
3. Spot-check: open a psql session and run `\d listings` — confirm new columns exist

## ENVIRONMENT

- **Working directory:** the worktree root (current dir). Treat `.` as the app root.
- **Local Supabase:** already running. Config in `supabase/config.toml`.
- **Package manager:** `bun`
- **Scripts:** `bun run db:reset`, `bun run db:diff`, `bun run typecheck`
- **FORBIDDEN commands:** `bunx vitest run` (ERR-013 — hangs in cursor-agent shell)
- **psql:** available via `bunx supabase db psql` or direct `psql` on port 54322

## DONE CRITERIA

- `supabase/migrations/20260413000001_tripster_v1.sql` exists
- `bun run db:reset` applies cleanly
- `\d listings` shows all 25 new columns
- `\d guide_profiles` shows all 13 new columns
- All 23 new tables present (verify with `\dt public.listing_*` etc.)
- RLS enabled on every new table
- Single commit on `feat/tripster-v1/p1` with the message above
- Out-of-scope files untouched
