-- Migration: dual rating aggregation jobs
-- Creates aggregation functions, a trigger on reviews, and a pg_cron hourly job.

-- ============================================================
-- 1. Per-listing rating refresh
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_refresh_listing_rating(p_listing_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.listings l
  SET
    average_rating = COALESCE((
      SELECT AVG(r.rating)::numeric(3,2)
      FROM public.reviews r
      WHERE r.listing_id = l.id
        AND r.status = 'published'
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.listing_id = l.id
        AND r.status = 'published'
    ), 0)
  WHERE l.id = p_listing_id;
END;
$$;

-- ============================================================
-- 2. Per-guide rating refresh
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_refresh_guide_rating(p_guide_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.guide_profiles gp
  SET
    average_rating = COALESCE((
      SELECT AVG(r.rating)::numeric(3,2)
      FROM public.reviews r
      WHERE r.guide_id = gp.user_id
        AND r.status = 'published'
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.guide_id = gp.user_id
        AND r.status = 'published'
    ), 0)
  WHERE gp.user_id = p_guide_id;
END;
$$;

-- ============================================================
-- 3. Batch refresh all ratings (called by pg_cron)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_batch_refresh_all_ratings()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  lock_obtained boolean;
BEGIN
  -- Advisory lock prevents concurrent runs
  SELECT pg_try_advisory_lock(hashtext('fn_batch_refresh_all_ratings')) INTO lock_obtained;
  IF NOT lock_obtained THEN
    RETURN; -- Another instance is running
  END IF;

  -- Refresh listings that have new reviews in last 24h
  UPDATE public.listings l
  SET
    average_rating = COALESCE((
      SELECT AVG(r.rating)::numeric(3,2)
      FROM public.reviews r
      WHERE r.listing_id = l.id AND r.status = 'published'
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*) FROM public.reviews r
      WHERE r.listing_id = l.id AND r.status = 'published'
    ), 0)
  WHERE l.id IN (
    SELECT DISTINCT listing_id FROM public.reviews
    WHERE created_at > NOW() - INTERVAL '25 hours'
  );

  -- Refresh guide profiles for affected guides
  UPDATE public.guide_profiles gp
  SET
    average_rating = COALESCE((
      SELECT AVG(r.rating)::numeric(3,2)
      FROM public.reviews r
      WHERE r.guide_id = gp.user_id AND r.status = 'published'
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*) FROM public.reviews r
      WHERE r.guide_id = gp.user_id AND r.status = 'published'
    ), 0)
  WHERE gp.user_id IN (
    SELECT DISTINCT guide_id FROM public.reviews
    WHERE created_at > NOW() - INTERVAL '25 hours'
  );

  PERFORM pg_advisory_unlock(hashtext('fn_batch_refresh_all_ratings'));
END;
$$;

-- ============================================================
-- 4. Trigger: refresh ratings when a review is published
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_refresh_rating_on_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    PERFORM public.fn_refresh_listing_rating(NEW.listing_id);
    PERFORM public.fn_refresh_guide_rating(NEW.guide_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_refresh_rating_on_review ON public.reviews;
CREATE TRIGGER tg_refresh_rating_on_review
  AFTER INSERT OR UPDATE OF status ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_refresh_rating_on_review();

-- ============================================================
-- 5. pg_cron hourly job (conditional — only if extension exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'refresh-ratings-hourly',
      '0 * * * *',
      'SELECT public.fn_batch_refresh_all_ratings()'
    );
  END IF;
END;
$$;
