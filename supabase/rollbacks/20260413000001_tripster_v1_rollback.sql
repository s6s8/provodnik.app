-- ---------------------------------------------------------------------------
-- TRIPSTER V1 ROLLBACK
-- Reverses 20260413000001_tripster_v1.sql
-- Run manually: psql -f this_file  (Supabase does NOT auto-run rollback files)
-- Drop order: children before parents (reverse dependency order)
-- ---------------------------------------------------------------------------

-- 1. Views
DROP VIEW IF EXISTS public.v_guide_dashboard_kpi CASCADE;
DROP VIEW IF EXISTS public.v_guide_public_profile CASCADE;
DROP VIEW IF EXISTS public.v_listing_detail_tour CASCADE;
DROP VIEW IF EXISTS public.v_listing_detail_excursion CASCADE;
DROP VIEW IF EXISTS public.v_listing_card CASCADE;

-- 2. Tables — children first, parents last
DROP TABLE IF EXISTS public.dispute_events CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;

DROP TABLE IF EXISTS public.partner_payouts_ledger CASCADE;
DROP TABLE IF EXISTS public.partner_accounts CASCADE;

DROP TABLE IF EXISTS public.help_articles CASCADE;

DROP TABLE IF EXISTS public.bonus_ledger CASCADE;
DROP TABLE IF EXISTS public.referral_redemptions CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;

DROP TABLE IF EXISTS public.notifications CASCADE;

DROP TABLE IF EXISTS public.favorites_items CASCADE;
DROP TABLE IF EXISTS public.favorites_folders CASCADE;

DROP TABLE IF EXISTS public.review_replies CASCADE;
DROP TABLE IF EXISTS public.review_ratings_breakdown CASCADE;

DROP TABLE IF EXISTS public.listing_videos CASCADE;
DROP TABLE IF EXISTS public.listing_photos CASCADE;
DROP TABLE IF EXISTS public.listing_licenses CASCADE;

DROP TABLE IF EXISTS public.listing_schedule_extras CASCADE;
DROP TABLE IF EXISTS public.listing_schedule CASCADE;

DROP TABLE IF EXISTS public.listing_tariffs CASCADE;
DROP TABLE IF EXISTS public.listing_tour_departures CASCADE;

DROP TABLE IF EXISTS public.listing_meals CASCADE;
DROP TABLE IF EXISTS public.listing_days CASCADE;

-- 3. guide_profiles — drop additive columns
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS legal_status;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS inn;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS document_country;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS is_tour_operator;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS tour_operator_registry_number;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS average_rating;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS response_rate;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS review_count;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS contact_visibility_unlocked;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS locale;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS preferred_currency;
ALTER TABLE public.guide_profiles DROP COLUMN IF EXISTS notification_prefs;

-- 4. listings — drop additive columns
ALTER TABLE public.listings DROP COLUMN IF EXISTS exp_type;
ALTER TABLE public.listings DROP COLUMN IF EXISTS format;
ALTER TABLE public.listings DROP COLUMN IF EXISTS movement_type;
ALTER TABLE public.listings DROP COLUMN IF EXISTS languages;
ALTER TABLE public.listings DROP COLUMN IF EXISTS currencies;
ALTER TABLE public.listings DROP COLUMN IF EXISTS idea;
ALTER TABLE public.listings DROP COLUMN IF EXISTS route;
ALTER TABLE public.listings DROP COLUMN IF EXISTS theme;
ALTER TABLE public.listings DROP COLUMN IF EXISTS audience;
ALTER TABLE public.listings DROP COLUMN IF EXISTS facts;
ALTER TABLE public.listings DROP COLUMN IF EXISTS org_details;
ALTER TABLE public.listings DROP COLUMN IF EXISTS difficulty_level;
ALTER TABLE public.listings DROP COLUMN IF EXISTS included;
ALTER TABLE public.listings DROP COLUMN IF EXISTS not_included;
ALTER TABLE public.listings DROP COLUMN IF EXISTS accommodation;
ALTER TABLE public.listings DROP COLUMN IF EXISTS deposit_rate;
ALTER TABLE public.listings DROP COLUMN IF EXISTS pickup_point_text;
ALTER TABLE public.listings DROP COLUMN IF EXISTS dropoff_point_text;
ALTER TABLE public.listings DROP COLUMN IF EXISTS vehicle_type;
ALTER TABLE public.listings DROP COLUMN IF EXISTS baggage_allowance;
ALTER TABLE public.listings DROP COLUMN IF EXISTS pii_gate_rate;
ALTER TABLE public.listings DROP COLUMN IF EXISTS booking_cutoff_hours;
ALTER TABLE public.listings DROP COLUMN IF EXISTS event_span_hours;
ALTER TABLE public.listings DROP COLUMN IF EXISTS instant_booking;
ALTER TABLE public.listings DROP COLUMN IF EXISTS average_rating;
ALTER TABLE public.listings DROP COLUMN IF EXISTS review_count;
