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
-- The distinction the guard needs is not "is the new value null" but "who issued this
-- UPDATE". PostgreSQL answers that natively. ON DELETE SET NULL is implemented as an
-- internal RI trigger on guide_templates that issues an UPDATE against traveler_requests,
-- so this BEFORE UPDATE trigger runs *nested inside* that one:
--
--   * FK cascade      => pg_trigger_depth() = 2 (or more, if the delete itself cascaded)
--   * owner PATCH     => pg_trigger_depth() = 1, always
--
-- Measured on PostgreSQL 16.13 with an isolated cluster (plain table + FK + RLS + a probe
-- trigger logging pg_trigger_depth()/current_user): guide deletes the template as
-- `authenticated` => depth 2; traveler PATCHes the same column => depth 1. Nothing a
-- caller can set moves that number: reaching depth 2 on traveler_requests requires a
-- trigger that writes it, and `authenticated` has no TRIGGER privilege on the table. It
-- also needs no privilege at all to read, which is the point — the previous revision of
-- this migration probed guide_templates for the row's existence and needed SECURITY
-- DEFINER to do it, because guide_templates RLS hides an unpublished template from the
-- traveler and a guide who moved the template back to draft would have made a live row
-- look deleted. Trigger depth is invariant under RLS, so that whole escalation goes away:
-- the function stays SECURITY INVOKER, owns no new privileged surface, and reads nothing.
--
-- The change is still only permitted null-ward. A nested writer may clear a dead link; it
-- may not repoint the request at a different excursion, and the snapshot below stays
-- frozen unconditionally for every caller.
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

-- CREATE OR REPLACE resets unspecified function properties, so omitting SECURITY DEFINER
-- here actively clears prosecdef rather than merely declining to set it — verified.
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

COMMENT ON FUNCTION public.fn_freeze_request_lineage() IS
  'Freezes traveler_requests.target_guide_id, guide_template_id and guide_template_snapshot after creation. guide_template_id may only go to NULL from inside a nested trigger (pg_trigger_depth() > 1) — that is the FK''s own ON DELETE SET NULL, never a client PATCH. SECURITY INVOKER: the test reads no table, so no RLS bypass is needed.';

commit;
