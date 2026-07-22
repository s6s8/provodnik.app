-- #39 repair — close directed-request discovery and preferred_guide_slug mutation bypasses.
--
-- 20260719000400 gated privacy on target_guide_id, and 20260723120000 blocked direct
-- inserts with preferred_guide_slug. Two holes remained:
--
--   1. traveler_requests_select still exposed every open, non-moderated row to any
--      authenticated session — including resolved directed requests (target_guide_id set)
--      and unresolved slug-only rows (preferred_guide_slug set, target_guide_id null).
--   2. traveler_requests_update still let the owner PATCH preferred_guide_slug after an
--      ordinary insert, recreating the insert bypass through the next door.
--
-- Close both at the database boundary. Remediate legacy unresolved slug rows with the
-- established admin-block lifecycle semantics so they stay non-public without being
-- silently converted into ordinary discoverable requests.

-- Legacy unresolved slug rows: non-public, audit-retained, admin-reviewable.
SELECT set_config('app.admin_request_lifecycle_write', '1', true);

UPDATE public.traveler_requests
   SET admin_blocked_at = timezone('utc', now()),
       admin_block_reason = 'Legacy unresolved preferred_guide_slug privacy remediation'
 WHERE preferred_guide_slug IS NOT NULL
   AND target_guide_id IS NULL
   AND admin_blocked_at IS NULL
   AND deleted_at IS NULL;

-- Public discovery: only genuinely open, undirected requests.
CREATE OR REPLACE VIEW public.v_public_open_requests AS
  SELECT id,
         destination,
         region,
         interests,
         starts_on,
         ends_on,
         start_time,
         end_time,
         budget_minor,
         currency,
         participants_count,
         format_preference,
         NULL::text AS notes,
         open_to_join,
         group_capacity,
         status,
         created_at,
         date_flexibility,
         date_locked,
         time_locked,
         requested_languages
    FROM public.traveler_requests tr
   WHERE status = 'open'::public.request_status
     AND target_guide_id IS NULL
     AND preferred_guide_slug IS NULL
     AND admin_blocked_at IS NULL
     AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.request_is_discoverable(p_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.traveler_requests tr
    WHERE tr.id = p_request_id
      AND tr.admin_blocked_at IS NULL
      AND tr.deleted_at IS NULL
      AND tr.status = 'open'::public.request_status
      AND tr.target_guide_id IS NULL
      AND tr.preferred_guide_slug IS NULL
  );
$$;

-- Direct reads: generic authenticated discovery is for public open requests only.
DROP POLICY IF EXISTS traveler_requests_select ON public.traveler_requests;
CREATE POLICY traveler_requests_select ON public.traveler_requests FOR SELECT USING (
  (
    (SELECT auth.uid()) = traveler_id
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
  OR is_admin()
  OR (
    target_guide_id IS NOT NULL
    AND (SELECT auth.uid()) = target_guide_id
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
  OR (
    (SELECT auth.uid()) IS NOT NULL
    AND status = 'open'::public.request_status
    AND target_guide_id IS NULL
    AND preferred_guide_slug IS NULL
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
);

-- preferred_guide_slug is set once at directed-request creation, never by client PATCH.
CREATE OR REPLACE FUNCTION public.fn_freeze_request_lineage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.target_guide_id IS DISTINCT FROM OLD.target_guide_id THEN
    RAISE EXCEPTION 'target_guide_id_not_editable' USING ERRCODE = '42501';
  END IF;

  IF NEW.preferred_guide_slug IS DISTINCT FROM OLD.preferred_guide_slug THEN
    RAISE EXCEPTION 'preferred_guide_slug_not_editable' USING ERRCODE = '42501';
  END IF;

  -- The only lineage change a client may cause is the one they did not ask for: the FK
  -- clearing the dead link a deleted template left behind. That arrives nested inside the
  -- RI trigger (depth > 1); a PATCH from the browser is always depth 1.
  IF NEW.guide_template_id IS DISTINCT FROM OLD.guide_template_id
     AND NOT (NEW.guide_template_id IS NULL AND pg_trigger_depth() > 1) THEN
    RAISE EXCEPTION 'guide_template_id_not_editable' USING ERRCODE = '42501';
  END IF;

  IF NEW.guide_template_snapshot IS DISTINCT FROM OLD.guide_template_snapshot THEN
    RAISE EXCEPTION 'guide_template_snapshot_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_freeze_request_lineage ON public.traveler_requests;
CREATE TRIGGER trg_freeze_request_lineage
  BEFORE UPDATE OF target_guide_id, preferred_guide_slug, guide_template_id, guide_template_snapshot
    ON public.traveler_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_freeze_request_lineage();

COMMENT ON FUNCTION public.fn_freeze_request_lineage() IS
  'Freezes traveler_requests.target_guide_id, preferred_guide_slug, guide_template_id and guide_template_snapshot after creation. guide_template_id may only go to NULL from inside a nested trigger (pg_trigger_depth() > 1) — that is the FK''s own ON DELETE SET NULL, never a client PATCH. SECURITY INVOKER: the test reads no table, so no RLS bypass is needed.';
