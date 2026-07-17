-- Fix: a guide could self-publish a listing, bypassing admin moderation.
--
-- Root cause: 20260715000000_listings_active_to_published renamed the approved
-- public status from 'active' to 'published', but fn_enforce_listing_transition's
-- state array was left as ['draft','pending_review','active','rejected','archived'].
-- The trigger only enforces when BOTH old and new status are in that array, so any
-- transition touching 'published' (e.g. draft→published, pending_review→published)
-- skipped enforcement entirely. Combined with listings_update RLS (a guide may
-- update any column of their own listing) and bulkSetStatus accepting 'published',
-- a guide could move their own listing straight to 'published' without admin review.
--
-- Fix at the DB boundary: 'published' joins the guarded set, the moderation graph
-- is defined in the published world, and the two administrative decisions
-- (approve → published, reject) are gated on is_admin(). Trusted backend contexts
-- (seed / service-role jobs, which have no auth.uid()) are exempt so idempotent
-- re-seeds and admin tooling keep working. Guides retain draft→pending_review
-- submission and published→archived / →pending_review self-service.
--
-- Rollback: the previous body is preserved in
-- 20260702000000_current_schema_baseline.sql (fn_enforce_listing_transition);
-- re-applying that definition reverts this change (forward-only repair).

CREATE OR REPLACE FUNCTION public.fn_enforce_listing_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  old_s text := OLD.status::text;
  new_s text := NEW.status::text;
  moderation_states text[] :=
    ARRAY['draft','pending_review','active','published','rejected','archived'];
  -- No auth context ⇒ trusted backend (seed / service-role). Admins are gated by role.
  privileged boolean := (select auth.uid()) IS NULL OR public.is_admin();
BEGIN
  IF old_s = ANY(moderation_states)
     AND new_s = ANY(moderation_states)
     AND old_s IS DISTINCT FROM new_s THEN

    -- Approval and rejection are administrative decisions, never guide self-service.
    IF new_s IN ('published','active','rejected') AND NOT privileged THEN
      RAISE EXCEPTION 'Only an administrator can move a listing to "%".', new_s
        USING ERRCODE = 'check_violation';
    END IF;

    IF NOT (
      (old_s = 'draft'                 AND new_s = 'pending_review')               OR
      (old_s = 'pending_review'        AND new_s IN ('published','rejected'))      OR
      (old_s IN ('published','active') AND new_s IN ('pending_review','archived')) OR
      (old_s = 'rejected'              AND new_s IN ('pending_review','archived')) OR
      (old_s = 'active'                AND new_s = 'published') -- legacy reconcile
    ) THEN
      RAISE EXCEPTION 'Illegal listing status transition: % → %.', old_s, new_s
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- The moderation audit trigger inserts into listing_moderation_events, whose RLS
-- (moderation_events_insert WITH CHECK is_admin()) rejects non-admins. Because the
-- trigger was NOT security definer, that insert ran as the acting user — so ANY
-- non-admin status change failed at the audit step. Two bad consequences: audit
-- logging doubled as accidental access control (fragile — flip the trigger to
-- definer and the self-publish hole above opens), and legitimate guide self-service
-- (archive / resubmit) was impossible. Make the audit trigger security definer so
-- it always records the transition; the transition guard above is now the real
-- authority for who may reach which state.
CREATE OR REPLACE FUNCTION public.fn_log_listing_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.listing_moderation_events(listing_id, actor_id, from_status, to_status)
    VALUES (NEW.id, (SELECT auth.uid()), OLD.status::text, NEW.status::text);
  END IF;
  RETURN NEW;
END;
$function$;
