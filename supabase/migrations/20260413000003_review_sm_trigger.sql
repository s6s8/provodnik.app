-- ---------------------------------------------------------------------------
-- TRIPSTER V1 — Review + Reply state machines
-- Extends review_status enum with Tripster draft/submitted states
-- Adds trigger on reviews and review_replies
-- ---------------------------------------------------------------------------

-- Extend review_status enum
ALTER TYPE public.review_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.review_status ADD VALUE IF NOT EXISTS 'submitted';

-- Reviews transition enforcement
CREATE OR REPLACE FUNCTION public.fn_enforce_review_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_s text := OLD.status::text;
  new_s text := NEW.status::text;
BEGIN
  IF NOT (
    (old_s = 'draft'     AND new_s IN ('submitted'))            OR
    (old_s = 'submitted' AND new_s IN ('published','hidden'))   OR
    (old_s = 'published' AND new_s = 'hidden')                  OR
    (old_s = new_s)
  ) THEN
    RAISE EXCEPTION 'Illegal review transition: % → %.', old_s, new_s;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_review_transition ON public.reviews;
CREATE TRIGGER tg_enforce_review_transition
  BEFORE UPDATE OF status ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_review_transition();

-- Review replies transition enforcement (status column lives on review_replies, added in migration 1.1)
CREATE OR REPLACE FUNCTION public.fn_enforce_reply_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_s text := OLD.status;
  new_s text := NEW.status;
BEGIN
  IF NOT (
    (old_s = 'draft'          AND new_s = 'pending_review')  OR
    (old_s = 'pending_review' AND new_s IN ('published','draft')) OR
    (old_s = new_s)
  ) THEN
    RAISE EXCEPTION 'Illegal reply transition: % → %.', old_s, new_s;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_reply_transition ON public.review_replies;
CREATE TRIGGER tg_enforce_reply_transition
  BEFORE UPDATE OF status ON public.review_replies
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_reply_transition();
