# Task 48 — execution notes (self-evolving)

## 2026-07-08 — Enforcement chokepoint for calendar blocks (layer B)

Codebase reality vs. plan wording (§3, §8.2 "no branch may create an assignment
that bypasses the check"):

- Provodnik is a **bid model**, not instant booking. A traveler request
  (`traveler_requests`) never carries a `guide_id`; `preferred_guide_slug` is
  display-only metadata (text, no FK). Requests do **not** reserve a guide.
- The one and only place a guide binds themselves to a **freely chosen**
  date/time is the **offer insert** (`createGuideOffer` → `guide_offers`, columns
  `starts_at`/`ends_at`). It already gates on layer A (`is_available`) and
  layer C (`account_status='active'`) both in the server action and in the
  `guide_offers_insert` RLS policy.
- Every downstream path inherits that already-validated `starts_at`:
  - `counter_offer` RPC copies `starts_at` from the parent offer.
  - `accept_offer` RPC and `createBooking` (the two accept paths) copy the
    offer's time into `bookings`; neither lets the traveler pick a new time.

**Decision:** enforce layer B at the offer insert only — app guard in
`submitOfferAction`/`editOfferAction` + a conjunct in the `guide_offers_insert`
RLS policy (blocks the direct-API bypass). This is the true root-cause
chokepoint; guarding it covers bookings, counters and accepts for free.

**Scoped deferral (documented, not a silent gap):** the plan's §3.2 traveler
pre-send warning on a named request is UX-only and non-binding (the request can
still go to other guides; date may be flexible — see plan §10 open questions).
It is intentionally out of the MVP hard-guard and left for a follow-up, because
adding a hard block on request creation would be a product change to the
traveler flow that the plan itself lists as an unresolved question. The security
guarantee ("no booking on a blocked interval, via UI or API") is fully met at
the offer chokepoint.

## Block table keyed to the guide, not a listing

An existing per-listing block layer exists (`listing_schedule_extras` +
`/guide/calendar`). Task 48 needs **guide-wide** blocks, so a new table
`guide_availability_blocks` keyed to `guide_profiles.user_id` is added, mirroring
the `guide_availability_events` precedent (separate table — never add columns to
`guide_profiles`, which would break the frozen `search_guides` rowtype, error
42804).

## TZ handling

Overlap of two `timestamptz` intervals is timezone-independent (absolute
instants). TZ only matters when converting a guide-entered calendar date/time
(Moscow, UTC+3, no DST) into stored UTC. We build explicit MSK-offset instants
(`YYYY-MM-DDT00:00:00+03:00`) — never `new Date().toISOString().slice(0,10)`
(AP-010). `min` on date inputs uses `todayMoscowISODate()`.

## Local DB / migration

Never `supabase db push` / `db reset` on the shared local instance (drift
landmine ERR-092 + shared with another worktree). New migration is applied to
the **local** docker DB via targeted SQL, verified (RLS + overlap), then
`bun run types` regenerates `database.types.ts`.
