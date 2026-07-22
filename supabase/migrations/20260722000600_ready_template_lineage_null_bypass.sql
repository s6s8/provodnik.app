-- Close the NULL bypass in the ready-template lineage freeze.
--
-- 20260722000400 froze the lineage with an asymmetric test:
--
--   IF NEW.guide_template_id IS NOT NULL
--      AND NEW.guide_template_id IS DISTINCT FROM OLD.guide_template_id
--
-- The `IS NOT NULL` was there to let the FK's own ON DELETE SET NULL through — but it
-- lets *every* null-ward change through, including the request owner PATCHing
-- `guide_template_id` to NULL from the browser. RLS permits that update (it is their own
-- row), so the "immutable source lineage" was one PATCH away from gone: the request keeps
-- the snapshot but stops pointing at the excursion it came from, and every join that goes
-- through the live id — moderation, the guide's own view of what was booked from their
-- template, any later reconciliation — silently loses the row.
--
-- The distinction the old code needed is not "is the new value null" but "is the template
-- still there". ON DELETE SET NULL is implemented as an ordinary UPDATE fired from the FK's
-- AFTER DELETE trigger, i.e. *after* the referenced row is gone, so inside this trigger:
--
--   * FK cascade      => OLD.guide_template_id no longer resolves to a guide_templates row
--   * owner PATCH     => it still does (the FK guarantees it, or OLD would already be NULL)
--
-- That is a property of the database's own state, not of anything the caller can set — no
-- marker column, no session GUC, no weakened RLS. Verified on PostgreSQL 16.
--
-- SECURITY DEFINER is load-bearing here, not decoration. The trigger otherwise runs as
-- `authenticated`, where guide_templates RLS shows the traveler only published templates
-- and their own. A guide who moves the template back to draft would make the row invisible
-- to the traveler, the existence probe would read "gone", and the bypass would reopen —
-- confirmed by counterfactual. The body only reads and raises; it writes nothing.
--
-- Everything else from 20260722000400 is intentionally unchanged: same function name and
-- signature, same trigger, same errcodes, same admin/trusted-backend escape, and the FK
-- lifecycle keeps working exactly as documented there (link nulled, snapshot kept).
--
-- Rollback: restore the 20260722000400 body of public.fn_freeze_request_lineage().
--
-- PROD: do NOT `supabase db push` (the prod migration ledger is truncated — landmine).
-- Apply as targeted SQL + a manual ledger entry.

begin;

CREATE OR REPLACE FUNCTION public.fn_freeze_request_lineage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.target_guide_id IS DISTINCT FROM OLD.target_guide_id THEN
    RAISE EXCEPTION 'target_guide_id_not_editable' USING ERRCODE = '42501';
  END IF;

  -- The only lineage change a client may cause is the one they did not ask for: the FK
  -- clearing the dead link a deleted template left behind. The snapshot below is what
  -- keeps that request readable, and it is frozen unconditionally.
  IF NEW.guide_template_id IS DISTINCT FROM OLD.guide_template_id
     AND NOT (
       NEW.guide_template_id IS NULL
       AND NOT EXISTS (
         SELECT 1
           FROM public.guide_templates t
          WHERE t.id = OLD.guide_template_id
       )
     ) THEN
    RAISE EXCEPTION 'guide_template_id_not_editable' USING ERRCODE = '42501';
  END IF;

  IF NEW.guide_template_snapshot IS DISTINCT FROM OLD.guide_template_snapshot THEN
    RAISE EXCEPTION 'guide_template_snapshot_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public.fn_freeze_request_lineage() OWNER TO postgres;

COMMENT ON FUNCTION public.fn_freeze_request_lineage() IS
  'Freezes traveler_requests.target_guide_id, guide_template_id and guide_template_snapshot after creation. guide_template_id may only go to NULL when the referenced guide_templates row is actually gone — that is the FK''s ON DELETE SET NULL, not a client PATCH. SECURITY DEFINER so guide_templates RLS cannot make a live template look deleted.';

commit;
