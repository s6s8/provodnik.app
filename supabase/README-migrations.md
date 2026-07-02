# Supabase migrations

This folder is intentionally baselined.

Historical April-July one-off migrations were squashed into:

- `20260702000000_current_schema_baseline.sql`

Why:

- remove duplicate/repeated migration files;
- remove stale demo-seed-only failures;
- keep one reproducible current schema for clean local resets/new environments;
- keep future migrations focused and linear.

Rules going forward:

1. Do not edit the baseline for new product changes.
2. Create new migrations after `20260702000000` only.
3. Demo/test seed data should not live in production schema migrations unless it is required application data.
4. If a migration only repairs live drift, verify live DB first and document whether it changes schema, data, or only migration history.
