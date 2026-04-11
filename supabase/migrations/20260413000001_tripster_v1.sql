-- ---------------------------------------------------------------------------
-- TRIPSTER V1 MEGAMIGRATION
-- Adds: 25 columns to listings, 12 columns to guide_profiles,
--       23 new tables, 5 views, full RLS policies
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. listings — additive columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS exp_type text CHECK (exp_type IN (
  'excursion','waterwalk','masterclass','photosession','quest','activity','tour','transfer'
));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS format text CHECK (format IN ('group','private','combo'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS movement_type text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS currencies text[] DEFAULT '{RUB}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS idea text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS route text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS audience text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS facts text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS org_details jsonb;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('easy','medium','hard','extreme'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS included text[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS not_included text[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS accommodation jsonb;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS deposit_rate numeric(4,3) DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pickup_point_text text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS dropoff_point_text text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS baggage_allowance text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pii_gate_rate numeric(4,3) DEFAULT 0.60;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS booking_cutoff_hours int DEFAULT 24;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS event_span_hours int;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS instant_booking boolean DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 2. guide_profiles — additive columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS legal_status text CHECK (legal_status IN ('self_employed','individual','company'));
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS inn text;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS document_country text;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS is_tour_operator boolean DEFAULT false;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS tour_operator_registry_number text;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS response_rate numeric(4,3) DEFAULT 0;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS contact_visibility_unlocked boolean DEFAULT false;
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS locale text DEFAULT 'ru';
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'RUB';
ALTER TABLE public.guide_profiles ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. New tables
-- ---------------------------------------------------------------------------

-- listing_days
CREATE TABLE IF NOT EXISTS public.listing_days (
  listing_id    uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  day_number    smallint NOT NULL,
  title         text,
  body          text,
  date_override date,
  PRIMARY KEY (listing_id, day_number)
);

-- listing_meals
CREATE TABLE IF NOT EXISTS public.listing_meals (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  day_number smallint NOT NULL,
  meal_type  text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  status     text NOT NULL CHECK (status IN ('included','paid_extra','not_included')),
  note       text,
  PRIMARY KEY (listing_id, day_number, meal_type)
);

-- listing_tour_departures
CREATE TABLE IF NOT EXISTS public.listing_tour_departures (
  id           uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  price_minor  int NOT NULL,
  currency     text NOT NULL DEFAULT 'RUB',
  max_persons  smallint NOT NULL,
  status       text NOT NULL DEFAULT 'open'
);

-- listing_tariffs
CREATE TABLE IF NOT EXISTS public.listing_tariffs (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  label       text NOT NULL,
  price_minor int NOT NULL,
  currency    text DEFAULT 'RUB',
  min_persons smallint,
  max_persons smallint
);

-- listing_schedule
CREATE TABLE IF NOT EXISTS public.listing_schedule (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  weekday    smallint CHECK (weekday BETWEEN 0 AND 6),
  time_start time NOT NULL,
  time_end   time NOT NULL
);

-- listing_schedule_extras
CREATE TABLE IF NOT EXISTS public.listing_schedule_extras (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date       date NOT NULL,
  time_start time,
  time_end   time
);

-- listing_licenses
CREATE TABLE IF NOT EXISTS public.listing_licenses (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  license_id uuid NOT NULL,
  scope      text,
  PRIMARY KEY (listing_id, license_id)
);

-- listing_photos
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url        text NOT NULL,
  position   int DEFAULT 0,
  alt_text   text
);

-- listing_videos
CREATE TABLE IF NOT EXISTS public.listing_videos (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url        text NOT NULL,
  poster_url text,
  position   int DEFAULT 0
);

-- review_ratings_breakdown
CREATE TABLE IF NOT EXISTS public.review_ratings_breakdown (
  review_id uuid NOT NULL,
  axis      text NOT NULL CHECK (axis IN ('material','engagement','knowledge','route')),
  score     smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  PRIMARY KEY (review_id, axis)
);

-- review_replies
CREATE TABLE IF NOT EXISTS public.review_replies (
  id           uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  review_id    uuid NOT NULL,
  guide_id     uuid NOT NULL,
  body         text NOT NULL,
  status       text CHECK (status IN ('draft','pending_review','published')) DEFAULT 'draft',
  submitted_at timestamptz,
  published_at timestamptz
);

-- favorites_folders
CREATE TABLE IF NOT EXISTS public.favorites_folders (
  id       uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id  uuid NOT NULL,
  name     text NOT NULL,
  position int DEFAULT 0
);

-- favorites_items
CREATE TABLE IF NOT EXISTS public.favorites_items (
  folder_id  uuid NOT NULL REFERENCES public.favorites_folders(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now(),
  PRIMARY KEY (folder_id, listing_id)
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id    uuid NOT NULL,
  event_type text NOT NULL,
  payload    jsonb,
  channel    text CHECK (channel IN ('inbox','email','telegram','push')),
  status     text CHECK (status IN ('pending','sent','failed','read')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  read_at    timestamptz
);

-- referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id    uuid NOT NULL,
  code       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- referral_redemptions
CREATE TABLE IF NOT EXISTS public.referral_redemptions (
  code_id     uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  redeemed_by uuid NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  PRIMARY KEY (code_id, redeemed_by)
);

-- bonus_ledger
CREATE TABLE IF NOT EXISTS public.bonus_ledger (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id    uuid NOT NULL,
  delta      int NOT NULL,
  reason     text,
  ref_id     uuid,
  created_at timestamptz DEFAULT now()
);

-- help_articles
CREATE TABLE IF NOT EXISTS public.help_articles (
  id       uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug     text UNIQUE NOT NULL,
  category text,
  title    text NOT NULL,
  body_md  text NOT NULL,
  position int DEFAULT 0
);

-- partner_accounts
CREATE TABLE IF NOT EXISTS public.partner_accounts (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL,
  api_token_hash  text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- partner_payouts_ledger
CREATE TABLE IF NOT EXISTS public.partner_payouts_ledger (
  id         uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_accounts(id) ON DELETE CASCADE,
  delta      int NOT NULL,
  ref_id     uuid,
  created_at timestamptz DEFAULT now()
);

-- disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  booking_id  uuid,
  opened_by   uuid,
  status      text CHECK (status IN ('open','investigating','resolved','closed')) DEFAULT 'open',
  resolution  text,
  opened_at   timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- dispute_events
CREATE TABLE IF NOT EXISTS public.dispute_events (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  dispute_id  uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  actor_id    uuid,
  event_type  text,
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_listing_card AS
SELECT
  id,
  title,
  image_url,
  exp_type,
  format,
  languages,
  average_rating,
  review_count,
  price_from_minor AS price
FROM public.listings;

GRANT SELECT ON public.v_listing_card TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_listing_detail_excursion AS
SELECT
  l.id,
  l.title,
  l.description,
  l.exp_type,
  l.format,
  l.languages,
  l.average_rating,
  l.review_count,
  l.price_from_minor,
  l.currency,
  l.duration_minutes,
  l.meeting_point,
  l.included,
  l.not_included,
  l.pii_gate_rate,
  l.booking_cutoff_hours,
  l.instant_booking,
  json_agg(DISTINCT to_jsonb(ls) - 'listing_id') FILTER (WHERE ls.id IS NOT NULL) AS schedule,
  json_agg(DISTINCT to_jsonb(lt) - 'listing_id') FILTER (WHERE lt.id IS NOT NULL) AS tariffs,
  json_agg(DISTINCT to_jsonb(lp) - 'listing_id') FILTER (WHERE lp.id IS NOT NULL) AS photos
FROM public.listings l
LEFT JOIN public.listing_schedule ls      ON ls.listing_id = l.id
LEFT JOIN public.listing_tariffs lt       ON lt.listing_id = l.id
LEFT JOIN public.listing_photos lp        ON lp.listing_id = l.id
GROUP BY l.id;

GRANT SELECT ON public.v_listing_detail_excursion TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_listing_detail_tour AS
SELECT
  l.id,
  l.title,
  l.description,
  l.exp_type,
  l.format,
  l.languages,
  l.average_rating,
  l.review_count,
  l.price_from_minor,
  l.currency,
  l.difficulty_level,
  l.included,
  l.not_included,
  l.accommodation,
  l.pii_gate_rate,
  l.booking_cutoff_hours,
  l.instant_booking,
  json_agg(DISTINCT to_jsonb(ld) - 'listing_id') FILTER (WHERE ld.listing_id IS NOT NULL) AS days,
  json_agg(DISTINCT to_jsonb(lm) - 'listing_id') FILTER (WHERE lm.listing_id IS NOT NULL) AS meals,
  json_agg(DISTINCT to_jsonb(ltd) - 'listing_id') FILTER (WHERE ltd.id IS NOT NULL)        AS departures,
  json_agg(DISTINCT to_jsonb(lp) - 'listing_id') FILTER (WHERE lp.id IS NOT NULL)         AS photos
FROM public.listings l
LEFT JOIN public.listing_days ld               ON ld.listing_id = l.id
LEFT JOIN public.listing_meals lm              ON lm.listing_id = l.id
LEFT JOIN public.listing_tour_departures ltd   ON ltd.listing_id = l.id
LEFT JOIN public.listing_photos lp             ON lp.listing_id = l.id
GROUP BY l.id;

GRANT SELECT ON public.v_listing_detail_tour TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_guide_public_profile AS
SELECT
  gp.user_id,
  gp.slug,
  gp.display_name,
  gp.bio,
  gp.regions,
  gp.languages,
  gp.specialties,
  gp.average_rating,
  gp.review_count,
  gp.response_rate,
  gp.contact_visibility_unlocked,
  gp.is_available,
  gp.locale,
  gp.preferred_currency
FROM public.guide_profiles gp
WHERE gp.verification_status = 'approved';

GRANT SELECT ON public.v_guide_public_profile TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_guide_dashboard_kpi AS
SELECT
  gp.user_id AS guide_id,
  gp.average_rating,
  gp.review_count,
  gp.response_rate,
  count(DISTINCT l.id)                                                 AS listing_count,
  count(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed')          AS active_bookings,
  count(DISTINCT b.id) FILTER (WHERE b.status = 'completed')          AS completed_bookings,
  count(DISTINCT tr.id)                                                AS open_requests
FROM public.guide_profiles gp
LEFT JOIN public.listings l          ON l.guide_id = gp.user_id
LEFT JOIN public.bookings b          ON b.guide_id = gp.user_id
LEFT JOIN public.traveler_requests tr ON tr.status = 'open'
GROUP BY gp.user_id, gp.average_rating, gp.review_count, gp.response_rate;

GRANT SELECT ON public.v_guide_dashboard_kpi TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS — enable + policies for all 23 new tables
-- ---------------------------------------------------------------------------

-- listing_days
ALTER TABLE public.listing_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_days_select" ON public.listing_days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_days_insert" ON public.listing_days FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_days_update" ON public.listing_days FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_days_delete" ON public.listing_days FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_meals
ALTER TABLE public.listing_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_meals_select" ON public.listing_meals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_meals_insert" ON public.listing_meals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_meals_update" ON public.listing_meals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_meals_delete" ON public.listing_meals FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_tour_departures
ALTER TABLE public.listing_tour_departures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_tour_departures_select" ON public.listing_tour_departures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tour_departures_insert" ON public.listing_tour_departures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tour_departures_update" ON public.listing_tour_departures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tour_departures_delete" ON public.listing_tour_departures FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_tariffs
ALTER TABLE public.listing_tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_tariffs_select" ON public.listing_tariffs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tariffs_insert" ON public.listing_tariffs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tariffs_update" ON public.listing_tariffs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_tariffs_delete" ON public.listing_tariffs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_schedule
ALTER TABLE public.listing_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_schedule_select" ON public.listing_schedule FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_insert" ON public.listing_schedule FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_update" ON public.listing_schedule FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_delete" ON public.listing_schedule FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_schedule_extras
ALTER TABLE public.listing_schedule_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_schedule_extras_select" ON public.listing_schedule_extras FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_extras_insert" ON public.listing_schedule_extras FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_extras_update" ON public.listing_schedule_extras FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_schedule_extras_delete" ON public.listing_schedule_extras FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_licenses
ALTER TABLE public.listing_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_licenses_select" ON public.listing_licenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_licenses_insert" ON public.listing_licenses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_licenses_delete" ON public.listing_licenses FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_photos
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_photos_select" ON public.listing_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_photos_insert" ON public.listing_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_photos_update" ON public.listing_photos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_photos_delete" ON public.listing_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- listing_videos
ALTER TABLE public.listing_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_videos_select" ON public.listing_videos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.status = 'published' OR (SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_videos_insert" ON public.listing_videos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_videos_update" ON public.listing_videos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));
CREATE POLICY "listing_videos_delete" ON public.listing_videos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND ((SELECT auth.uid()) = l.guide_id OR public.is_admin())));

-- review_ratings_breakdown (readable if review is published; writable by authenticated)
ALTER TABLE public.review_ratings_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_ratings_breakdown_select" ON public.review_ratings_breakdown FOR SELECT
  USING (true);
CREATE POLICY "review_ratings_breakdown_insert" ON public.review_ratings_breakdown FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL OR public.is_admin());
CREATE POLICY "review_ratings_breakdown_delete" ON public.review_ratings_breakdown FOR DELETE
  USING (public.is_admin());

-- review_replies (guide writes, public reads published ones)
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_replies_select" ON public.review_replies FOR SELECT
  USING (status = 'published' OR (SELECT auth.uid()) = guide_id OR public.is_admin());
CREATE POLICY "review_replies_insert" ON public.review_replies FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = guide_id OR public.is_admin());
CREATE POLICY "review_replies_update" ON public.review_replies FOR UPDATE
  USING ((SELECT auth.uid()) = guide_id OR public.is_admin());
CREATE POLICY "review_replies_delete" ON public.review_replies FOR DELETE
  USING ((SELECT auth.uid()) = guide_id OR public.is_admin());

-- favorites_folders
ALTER TABLE public.favorites_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_folders_select" ON public.favorites_folders FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "favorites_folders_insert" ON public.favorites_folders FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "favorites_folders_update" ON public.favorites_folders FOR UPDATE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "favorites_folders_delete" ON public.favorites_folders FOR DELETE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

-- favorites_items
ALTER TABLE public.favorites_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_items_select" ON public.favorites_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.favorites_folders f WHERE f.id = folder_id AND (f.user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY "favorites_items_insert" ON public.favorites_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.favorites_folders f WHERE f.id = folder_id AND (f.user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY "favorites_items_delete" ON public.favorites_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.favorites_folders f WHERE f.id = folder_id AND (f.user_id = (SELECT auth.uid()) OR public.is_admin())));

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin() OR (SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE
  USING (public.is_admin());

-- referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_codes_select" ON public.referral_codes FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "referral_codes_insert" ON public.referral_codes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "referral_codes_delete" ON public.referral_codes FOR DELETE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

-- referral_redemptions
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_redemptions_select" ON public.referral_redemptions FOR SELECT
  USING ((SELECT auth.uid()) = redeemed_by OR EXISTS (SELECT 1 FROM public.referral_codes rc WHERE rc.id = code_id AND rc.user_id = (SELECT auth.uid())) OR public.is_admin());
CREATE POLICY "referral_redemptions_insert" ON public.referral_redemptions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = redeemed_by OR public.is_admin());

-- bonus_ledger
ALTER TABLE public.bonus_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bonus_ledger_select" ON public.bonus_ledger FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "bonus_ledger_insert" ON public.bonus_ledger FOR INSERT
  WITH CHECK (public.is_admin());

-- help_articles (public read, admin write)
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_articles_select" ON public.help_articles FOR SELECT
  USING (true);
CREATE POLICY "help_articles_insert" ON public.help_articles FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY "help_articles_update" ON public.help_articles FOR UPDATE
  USING (public.is_admin());
CREATE POLICY "help_articles_delete" ON public.help_articles FOR DELETE
  USING (public.is_admin());

-- partner_accounts
ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_accounts_select" ON public.partner_accounts FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "partner_accounts_insert" ON public.partner_accounts FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "partner_accounts_update" ON public.partner_accounts FOR UPDATE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

-- partner_payouts_ledger
ALTER TABLE public.partner_payouts_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_payouts_ledger_select" ON public.partner_payouts_ledger FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.partner_accounts pa WHERE pa.id = partner_id AND pa.user_id = (SELECT auth.uid())) OR public.is_admin());
CREATE POLICY "partner_payouts_ledger_insert" ON public.partner_payouts_ledger FOR INSERT
  WITH CHECK (public.is_admin());

-- disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_select" ON public.disputes FOR SELECT
  USING ((SELECT auth.uid()) = opened_by OR public.is_admin());
CREATE POLICY "disputes_insert" ON public.disputes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL OR public.is_admin());
CREATE POLICY "disputes_update" ON public.disputes FOR UPDATE
  USING (public.is_admin());

-- dispute_events
ALTER TABLE public.dispute_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dispute_events_select" ON public.dispute_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_id AND (d.opened_by = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY "dispute_events_insert" ON public.dispute_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_id AND (d.opened_by = (SELECT auth.uid()) OR public.is_admin())));
