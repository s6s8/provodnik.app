-- Task 1.4 hardening: one ACTIVE offer per guide per request (DB-level double-submit guard).
-- Partial unique index over non-terminal offer_status values. Terminal states
-- (declined, expired, withdrawn, completed) are excluded so a guide may re-offer after them.
-- Pre-checked against live data 2026-06-11: 0 existing duplicate (request_id, guide_id) groups
-- among the live statuses below, so this index applies without violation.
create unique index if not exists guide_offers_one_active_per_guide_request
  on public.guide_offers (request_id, guide_id)
  where status in ('pending', 'bid_sent', 'counter_offered', 'accepted', 'confirmed', 'active');
