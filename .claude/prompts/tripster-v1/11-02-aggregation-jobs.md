# Phase 11.2 — Reputation: dual rating aggregation jobs

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-2`
**Branch:** `feat/tripster-v1-p11-2`

Tech stack: PostgreSQL (Supabase), TypeScript (for migration file), Bun.

**ADR-034:** Dual rating aggregation: `listings.average_rating` and `guide_profiles.average_rating` maintained by two separate pg_cron jobs with advisory locks.

**This wave creates a Supabase migration file** — no React components.

## SCOPE

**Create:**
1. `supabase/migrations/20260414000001_rating_aggregation_jobs.sql` — pg_cron jobs + aggregation functions

**DO NOT touch:** Any existing migrations, TypeScript files.

## TASK

The migration creates:

### 1. Aggregation functions

```sql
-- Function: refresh listing average rating
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

-- Function: refresh guide average rating
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

-- Function: batch refresh all ratings (called by pg_cron)
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
```

### 2. Trigger: refresh on review publish

```sql
-- Trigger to refresh ratings when a review is published
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
```

### 3. pg_cron job (if pg_cron extension available)

```sql
-- Schedule hourly batch refresh as fallback
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
```

## INVESTIGATION RULE

Before writing, check:
- `supabase/migrations/` — last migration filename to ensure ordering
- `src/lib/supabase/types.ts` — confirm `reviews` table has `listing_id`, `guide_id`, `rating`, `status` columns

## TDD CONTRACT

Migration must be valid SQL. Test by reviewing for syntax errors.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`

## DONE CRITERIA

- Migration file created
- All 3 functions created
- Trigger wired on reviews table
- pg_cron scheduled conditionally
- `bun run typecheck` exits 0 (no TS changes)
- Commit: `feat(reputation): dual rating aggregation — listing + guide avg_rating triggers + pg_cron`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
