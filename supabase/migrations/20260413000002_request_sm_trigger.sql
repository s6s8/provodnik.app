-- ---------------------------------------------------------------------------
-- TRIPSTER V1 — Request/Offer state machine
-- Extends offer_status enum with Tripster bid-first states
-- Adds trigger to enforce legal transitions on guide_offers
-- ---------------------------------------------------------------------------

-- Extend offer_status enum with Tripster values (ADD VALUE is idempotent from PG 14+)
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'bid_sent';
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'completed';

-- Transition enforcement function
CREATE OR REPLACE FUNCTION public.fn_enforce_offer_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_s text := OLD.status::text;
  new_s text := NEW.status::text;
  tripster_states text[] := ARRAY['bid_sent','confirmed','active','completed','declined'];
BEGIN
  -- Only enforce Tripster transitions when both states are in the Tripster set
  IF old_s = ANY(tripster_states) AND new_s = ANY(tripster_states) THEN
    IF NOT (
      (old_s = 'bid_sent'  AND new_s IN ('confirmed','declined')) OR
      (old_s = 'confirmed' AND new_s IN ('active','declined'))    OR
      (old_s = 'active'    AND new_s = 'completed')               OR
      (old_s = new_s) -- idempotent same-state write
    ) THEN
      RAISE EXCEPTION 'Illegal offer transition: % → %. Tripster SM violation.', old_s, new_s;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_offer_transition ON public.guide_offers;
CREATE TRIGGER tg_enforce_offer_transition
  BEFORE UPDATE OF status ON public.guide_offers
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_offer_transition();
