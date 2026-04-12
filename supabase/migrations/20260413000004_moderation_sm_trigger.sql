-- ---------------------------------------------------------------------------
-- TRIPSTER V1 — Listing moderation state machine
-- Extends listing_status enum with Tripster moderation states
-- Adds audit log table + trigger on listings.status
-- ---------------------------------------------------------------------------

-- Extend listing_status enum
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'archived';

-- Moderation audit log table
CREATE TABLE IF NOT EXISTS public.listing_moderation_events (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  actor_id    uuid,
  from_status text NOT NULL,
  to_status   text NOT NULL,
  reason      text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.listing_moderation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moderation_events_select" ON public.listing_moderation_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.guide_id = (SELECT auth.uid()))
    OR public.is_admin()
  );
CREATE POLICY "moderation_events_insert" ON public.listing_moderation_events FOR INSERT
  WITH CHECK (public.is_admin());

-- Listing status transition enforcement
CREATE OR REPLACE FUNCTION public.fn_enforce_listing_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_s text := OLD.status::text;
  new_s text := NEW.status::text;
  tripster_states text[] := ARRAY['draft','pending_review','active','rejected','archived'];
BEGIN
  -- Only enforce when both are Tripster moderation states
  IF old_s = ANY(tripster_states) AND new_s = ANY(tripster_states) THEN
    IF NOT (
      (old_s = 'draft'          AND new_s = 'pending_review')              OR
      (old_s = 'pending_review' AND new_s IN ('active','rejected'))        OR
      (old_s = 'active'         AND new_s IN ('pending_review','archived')) OR
      (old_s = 'rejected'       AND new_s IN ('pending_review','archived')) OR
      (old_s = new_s)
    ) THEN
      RAISE EXCEPTION 'Illegal listing status transition: % → %.', old_s, new_s;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_listing_transition ON public.listings;
CREATE TRIGGER tg_enforce_listing_transition
  BEFORE UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_listing_transition();

-- Audit log trigger — fires after every status change
CREATE OR REPLACE FUNCTION public.fn_log_listing_moderation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.listing_moderation_events(listing_id, actor_id, from_status, to_status)
    VALUES (NEW.id, (SELECT auth.uid()), OLD.status::text, NEW.status::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_log_listing_moderation ON public.listings;
CREATE TRIGGER tg_log_listing_moderation
  AFTER UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_listing_moderation();
