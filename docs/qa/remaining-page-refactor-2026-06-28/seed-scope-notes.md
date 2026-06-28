# Demo seed scope notes — 2026-06-28

Task F from the autonomous remaining-page refactor packet. Seed SQL is
schema-sensitive and out of scope for a bounded UI run, so this is a documented
TODO list, **not** a seed change. The audit
(`docs/qa/page-refactor-audit-2026-06-28/report.md`, P3 row) flagged thin demo
data: many category counts at zero, empty messages/reviews/bookings, and only a
few admin queue rows.

## Where seed data lives

- `supabase/migrations/20260401000002_seed.sql` — base seed: `auth.users`,
  `profiles`, `guide_profiles`, `listings`, `destinations`, `traveler_requests`,
  `guide_offers`, `open_request_members`, `bookings`, `reviews`, `favorites`,
  `quality_snapshots`.
- `supabase/migrations/20260504000002_reseed_listings.sql` — listing catalog
  refresh (catalog currently shows ~11 published listings on `/search`).
- `supabase/migrations/20260623160000_c6_seed_pending_replies.sql` — pending
  reply rows.
- `scripts/seed-test-users.mjs` — QA users (`qa-admin@`, `qa-guide@`,
  `qa-traveler@`).
- `src/data/quality/seed.ts` — quality snapshot seed helper.

## Concrete, schema-aware seed TODOs

Each item below should be added as a **new** dated migration (never edit applied
migrations) and matched to current table columns before running.

1. **Category coverage** — spread `listings.exp_type` across all
   `FilterBar` types (`excursion`, `waterwalk`, `masterclass`, `photosession`,
   `quest`, `activity`, `tour`, `transfer`) so `/search` type pills and
   `/destinations` counts are non-zero. Today most rows are `excursion`.
2. **Messages** — seed at least one full thread per role pair
   (traveler↔guide) so `/messages` and `/guide` inbox render real conversations,
   not "Загрузка…" then empty. Confirm the messages/threads table name + columns
   first (not present in the base seed above).
3. **Reviews** — `reviews` is seeded but sparse; add a few more per popular
   listing so `average_rating`/`review_count` render and `/guide/reviews` is
   populated.
4. **Bookings** — `bookings` exists but thin; add a couple of bookings in
   different states (pending/confirmed/completed) per the booking status enum so
   `/admin/bookings`, `/trips`, and guide `/guide/bookings` show variety.
5. **Admin queues** — add a moderation item and an open dispute so
   `/admin/moderation` and `/admin/disputes` have more than a couple of rows.
   Gate dispute rows behind the same data the `FEATURE_TR_DISPUTES` surfaces use.
6. **Favorites / referrals** — only relevant if the demo runs with
   `FEATURE_TR_FAVORITES` / `FEATURE_TR_REFERRALS` enabled (see `.env.example`);
   seed a folder + a couple of saved listings so those pages aren't empty when
   demoed.

## Constraints

- Do not invent flows that conflict with the live schema or RLS — verify column
  names and enums against the latest migrations first.
- Keep demo rows attributable to the seeded QA users so RLS-scoped pages render.
- One new migration per concern; re-run `supabase db push` (or the project's
  apply step) and re-run the page audit afterward.
