# Supabase Backend Scan

Source: `supabase/` + `src/lib/supabase/database.types.ts` (4686 lines, generated).
Scan date: 2026-07-03. Read-only.

## Migrations

- **4 forward migrations**, all dated **2026-07-02**. History (April–June 2026) was
  squashed; see `supabase/README-migrations.md`. Rollbacks dir shows the pre-squash
  timeline: `20260413` (tripster v1) → `20260623` (redesign foundation).
- Naming: `YYYYMMDDHHMMSS_snake_case_description.sql`.
  - `20260702000000_current_schema_baseline.sql` (6218 lines) — full schema baseline.
  - `20260702000001_publish_approved_guides.sql` — data backfill (is_available/slug for approved guides).
  - `20260702143000_enforce_active_account_for_guide_offers.sql` — hardens guide_offers insert/update RLS to require active+approved account.
  - `20260702170000_filter_public_guides_by_account_state.sql` — rewrites `search_guides` to hide non-active guide accounts.
- `config.toml`: Postgres major_version 17; API schemas = public, storage, graphql_public.
- `supabase/tests/` holds 10 SQL RLS/security regression tests (disputes insert, overbroad writes,
  role escalation, security_definer identity, storage hardening, thread access, transactional RPCs, etc.).

## Table Inventory (58 tables, all with RLS enabled)

### Identity / roles
- `profiles` — core user row; holds `role` (app_role) + `account_status`. Source of truth for authorization.
- `guide_profiles` — guide public/onboarding profile (slug, specializations, regions, ratings, is_available, verification_status).
- `partner_accounts` — B2B/agency partner accounts.

### Request-first marketplace core
- `traveler_requests` — traveler's trip request ("open request"); status open/booked/cancelled/expired; `open_to_join` for group.
- `open_request_members` — travelers who joined an open/group request (member_status joined/left).
- `guide_offers` — guide bids on a request (FK request_id, guide_id, listing_id); offer_status.
- `bookings` — confirmed engagement (FK traveler_id, guide_id, request_id, offer_id, listing_id); booking_status.
- `reviews` — traveler review of a booking/guide/listing (FK booking_id); review_status.
- `review_replies` — guide reply to a review (own status machine draft→pending_review→published).
- `review_ratings_breakdown` — per-review sub-scores (material/engagement/knowledge/route).
- `disputes` — dispute on a booking (FK booking_id, opened_by, assigned_admin_id); dispute_status.
- `dispute_events` / `dispute_evidence` / `dispute_notes` — dispute timeline, uploaded evidence, admin notes.
- `payment_agreements` — negotiated payment terms between traveler/guide.
- `request_views` / `request_views` counter via RPC — view counts on requests.

### Messaging
- `conversation_threads` — thread keyed by subject (request/offer/booking/dispute).
- `thread_participants` — membership of a thread.
- `messages` — thread messages (message_sender_role traveler/guide/admin/system).

### Listings (catalog) — large cluster
- `listings` — guide listing/tour/excursion (listing_status: draft/published/paused/rejected/pending_review/active/archived — dual naming, see risks).
- Detail children: `listing_days`, `listing_inclusions`, `listing_licenses`, `listing_meals`,
  `listing_media`, `listing_photos`, `listing_videos`, `listing_schedule`, `listing_schedule_extras`,
  `listing_slots`, `listing_tariffs`, `listing_tour_departures`, `listing_moderation_events`.
- Guide-owned: `guide_documents`, `guide_licenses`, `guide_location_photos`, `guide_templates`, `guide_testimonials`.
- `destinations` — canonical destination reference (public read).

### Moderation / admin
- `moderation_cases`, `moderation_actions` — moderation workflow (moderation_subject/decision enums).
- `admin_audit_log` — admin action audit trail.
- `quality_snapshots` — periodic quality metric snapshots (public read).

### Notifications / events
- `notifications`, `notification_deliveries`, `notification_email_log` — notification fan-out (notification_kind enum).
- `marketplace_events` — event log across request/booking/dispute/moderation scopes.

### Favorites
- `favorites`, `favorites_folders`, `favorites_items` — saved listings/guides (favorite_subject enum).

### Growth / monetization
- `referral_codes`, `referral_redemptions`, `referral_program_config` — referral program.
- `bonus_ledger`, `partner_payouts_ledger` — credit/payout ledgers.
- `business_leads` — inbound B2B leads (anon insertable).
- `help_articles` — help center content (public read).
- `storage_assets` — logical index of storage objects (bucket_id + object_path, storage_asset_kind).

### Views (not tables)
`public_guide_stats`, `public_listing_stats`, `v_guide_dashboard_kpi`, `v_guide_public_profile`,
`v_listing_card`, `v_listing_detail_excursion`, `v_listing_detail_tour`, `platform_stats`,
`guide_search_result_row` (composite type used by search_guides).

## RLS / Security Model

- **All 58 public tables have `ENABLE ROW LEVEL SECURITY`; 177 policies.** No table found without RLS.
  No `FORCE ROW LEVEL SECURITY` anywhere (table owners/`postgres` bypass RLS as usual).
- **Role derivation is DB-side, from `public.profiles`** (not the JWT) via SECURITY DEFINER helpers:
  `is_admin()`, `is_guide()`, `current_profile_role()`, `profile_role_for()`, `profile_account_status_for()`,
  `user_has_role()`. All additionally require `account_status='active'`. `custom_access_token_hook`
  ALSO copies `profiles.role` into the JWT `app_metadata.role` claim at token mint — so the claim
  is a mirror, but policies trust the table, not the claim.
- **Traveler/Guide/Admin summary:**
  - Traveler: full CRUD on own `traveler_requests`, `bookings` (insert as traveler), `reviews`,
    `favorites`, `open_request_members`. Reads own profile only.
  - Guide: insert/update own `guide_offers` (must be active + approved), own `listings`+children,
    own `guide_profiles`/documents; reads bookings where guide_id = self.
  - Admin: `is_admin()` grants read/write override on virtually every sensitive table
    (bookings, disputes, offers, requests, reviews, profiles, audit log).
  - Cross-actor read of counterparties uses SECURITY DEFINER "display profile" RPCs rather than
    broad SELECT grants (to avoid leaking full profiles).
- **Permissive `USING (true)` policies (8)** — all SELECT-only on public reference/aggregate data,
  plus one anon INSERT:
  - `destinations_public_read`, `help_articles_select`, `listing_inclusions_select_all`,
    `quality_snapshots_public_read`, `referral_config_select_all`, `review_ratings_breakdown_select`
    (SELECT true — low risk, public reference).
  - `profiles_select_auth_admin_hook` — SELECT true but scoped `TO supabase_auth_admin` (for token hook).
  - `business_leads_insert_any` — `WITH CHECK (true)` for `authenticated, anon` (public lead form; spam risk).
- **Notable exposure:** `traveler_requests_select` allows SELECT when `status='open'` with **no auth
  predicate** — any anon/public caller can read all open traveler requests (traveler_id, destination,
  dates, budget, notes). See risks.
- `profiles_update` WITH CHECK pins `role` and `account_status` to their DB values, so a user cannot
  self-escalate role or un-suspend via profile update (good).

## Database Functions

**46 functions total: 31 SECURITY DEFINER, 15 SECURITY INVOKER (mostly triggers).**

### SECURITY DEFINER (31) — run as `postgres`, bypass RLS
Transactional write RPCs (highest surface):
- `accept_offer(p_offer_id)` → creates booking + thread from an offer.
- `counter_offer(p_offer_id, price, message)` → counter negotiation.
- `open_dispute(p_booking_id, reason)` → opens dispute, may freeze payout.
- `submit_review(booking, guide, listing, scores...)` → inserts review + breakdown.
- `send_qa_message(thread, sender, role, body)` → posts message.
- `record_marketplace_event(...)`, `record_request_view(request)` → event/analytics writes.
- `admin_set_account_status(target_user, status, reason)` → admin suspends/archives users.
- `handle_new_user()` → trigger on auth.users → seeds profile (SECURITY DEFINER).
- `custom_access_token_hook(event)` → injects role claim into JWT.

Authorization / thread-access helpers (read-only, definer to see other rows):
- `is_admin`, `is_guide`, `current_profile_role`, `profile_role_for`, `profile_account_status_for`,
  `user_has_role`, `is_thread_participant`.
- `can_access_booking_thread`, `can_access_conversation_thread`, `can_access_dispute_thread`,
  `can_access_offer_thread`, `can_access_request_thread`, `can_create_conversation_thread`.

Discovery / display-profile RPCs (definer to bypass profile RLS, return curated columns):
- `search_guides(q, specializations, region, has_listings)`, `get_bidding_guides_for_request(request)`,
  `count_competing_offers(request)`, `guide_offer_exists_for_counter(request, guide)`,
  `get_interacted_requester_display_profiles()`, `get_joined_request_owner_display_profiles()`,
  `get_traveler_booking_guide_display_profiles()`.
- `guard_traveler_offer_update()` — trigger guarding traveler edits to offers.

### SECURITY INVOKER (15) — triggers / helpers, run as caller
- State-machine guards: `fn_enforce_listing_transition`, `fn_enforce_offer_transition`,
  `fn_enforce_reply_transition`, `fn_enforce_review_transition`.
- Ratings: `fn_refresh_guide_rating`, `fn_refresh_listing_rating`, `fn_batch_refresh_all_ratings`,
  `tg_refresh_rating_on_review`.
- Misc triggers/helpers: `set_updated_at`, `touch_thread_updated_at`, `sync_guide_profile_onboarding_fields`,
  `fn_log_listing_moderation`, `fn_notify_user`, `fn_deliver_pending_notifications`, `clean_text_array`.

All SECURITY DEFINER functions set `search_path = public` (mitigates search_path hijack).

## State Machines (enums)

- **request_status**: `open → booked | cancelled | expired`. (Enum has no explicit transition trigger.)
- **offer_status** enum is bloated (10 values): `pending, accepted, declined, expired, withdrawn,
  bid_sent, confirmed, active, completed, counter_offered`. Trigger `fn_enforce_offer_transition`
  only governs the "Tripster" subset: `bid_sent → confirmed|declined`, `confirmed → active|declined`,
  `active → completed` (+ idempotent same-state). Legacy values (pending/accepted/withdrawn/
  counter_offered/expired) are unguarded.
- **booking_status**: `pending, awaiting_guide_confirmation, confirmed, cancelled, completed,
  disputed, no_show`. No DB transition trigger found (enforced in app / RPCs).
- **dispute_status**: `open → under_review → resolved → closed`. No DB transition trigger.
- **listing_status** (7 values, dual naming): trigger `fn_enforce_listing_transition` governs
  `draft → pending_review → active|rejected`, `active → pending_review|archived`,
  `rejected → pending_review|archived`. Legacy `published`/`paused` values coexist but are outside
  the enforced set.
- **review_status**: `draft → submitted → published|hidden`, `published → hidden`
  (via `fn_enforce_review_transition`).
- **review_replies status** (text, not enum): `draft → pending_review → published|draft`.
- **guide_verification_status**: `draft → submitted → approved | rejected`.
- **account_status**: `active | suspended | archived`.

## Request-First Product Model & FKs

Flow: `traveler_requests` (open) ──< `guide_offers` (guide bids, FK request_id) ──accept──>
`bookings` (FK request_id + offer_id) ──> `reviews` (FK booking_id) / `disputes` (FK booking_id).
- Group/"open to join": `traveler_requests.open_to_join` + `open_request_members` (FK request_id).
- Negotiation lives on `guide_offers` (counter_offered status, `counter_offer` RPC) and
  `payment_agreements`; there is **no separate `negotiations` table**.
- Naming note: the domain uses **`traveler_requests`** (not `open_requests`) and **`guide_offers`**
  (not `offers`). Messaging threads (`conversation_threads`) can attach to request/offer/booking/dispute
  via `thread_subject`.
- `bookings` FKs are all nullable except traveler_id/guide_id, so a booking can exist without a
  request/offer/listing (direct booking path).

## Storage Buckets & Policies

Buckets referenced in `storage.objects` policies (no explicit `storage.buckets` INSERT seed in baseline;
buckets are provisioned out-of-band). Enum `storage_asset_kind`: guide-avatar, guide-document,
listing-cover, listing-gallery, dispute-evidence, guide-portfolio.
- **Public read**: `guide-avatars`, `listing-media`, `guide-portfolio` (`..._public_read USING bucket_id=...` — world readable).
- **Owner-scoped (folder[1] = auth.uid())**: `traveler-avatars`, `guide-media`, `guide-documents`,
  `listing-media` (write), `guide-portfolio` (write).
- **Private (owner or admin)**: `guide-documents`, `dispute-evidence` — SELECT limited to owner folder
  or `is_admin()`.
- Uploads generally gated by `foldername(name)[1] = auth.uid()` / `split_part(name,'/',1)=auth.uid()`.
- `storage_assets` table mirrors object metadata with its own RLS.

## Schema / Security Risks

1. **Public/anon read of all open traveler requests.** `traveler_requests_select` first branch is
   `status='open'` with no auth check → anon can enumerate every open request incl. traveler_id,
   destination, dates, budget, notes. Confirm this is intended for logged-out discovery; it leaks PII.
2. **Large SECURITY DEFINER surface (31 functions).** Several are transactional writers
   (`accept_offer`, `counter_offer`, `open_dispute`, `submit_review`, `send_qa_message`,
   `admin_set_account_status`) that bypass RLS; authorization is entirely in-function. Any missing
   ownership check inside these = privilege escalation. `admin_set_account_status` must verify caller
   is admin internally (RLS won't protect it). Needs focused audit + the existing
   `security_definer_rpc_identity_test`/`transactional_write_rpcs_test` kept green.
3. **Bloated/dual-lifecycle enums with partial trigger coverage.** `offer_status` (10 values) and
   `listing_status` (7 values) carry both legacy and "Tripster" states; transition triggers only guard
   the new subset, so legacy states allow arbitrary transitions. `booking_status` and `dispute_status`
   have NO DB-level transition enforcement (app-only). Refactor target: collapse enums, add guards.
4. **`business_leads_insert_any` = `WITH CHECK (true)` for anon** — unauthenticated insert (lead spam /
   table-flood vector); no rate limiting at DB layer.
5. **World-readable storage buckets + no bucket seed.** `guide-portfolio`, `guide-avatars`,
   `listing-media` are fully public-read; `guide-documents`/`dispute-evidence` correctly private, but
   correctness depends on folder-prefix = uid convention being enforced on every upload path. Buckets
   are not created in the baseline migration, so bucket existence/publicness is environment-drift-prone.

Secondary: role is trusted from `profiles` (good) but also mirrored into JWT via
`custom_access_token_hook` — ensure no policy elsewhere trusts the raw JWT claim instead of `is_admin()`.
Listing detail is spread across ~14 child tables (`listing_*`) — heavy join surface, candidate for
consolidation in the refactor.
