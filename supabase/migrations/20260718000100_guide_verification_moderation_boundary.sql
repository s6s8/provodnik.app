-- Fix: a guide could self-approve their verification.
--
-- Root cause: guide_profiles_update RLS gates only row ownership + active account,
-- not which columns change, and the authenticated role holds column UPDATE on every
-- column. No trigger froze the moderation-owned fields. So a logged-in guide could
-- PATCH their own row via PostgREST with verification_status='approved' — the public
-- visibility gate (guide_profiles_select treats 'approved' as visible) — without any
-- admin review. verification_notes and attestation_status were equally writable.
--
-- Fix at the DB boundary: a BEFORE UPDATE trigger that freezes the moderation trio
-- for non-admins, with ONE allowed guide transition — submitting their own profile
-- for review (draft|rejected -> submitted), which keeps submitForVerification working.
-- Admin writes go through the service-role client (bypasses RLS + this trigger runs
-- with is_admin() true), and trusted backend (no auth.uid) is exempt.
--
-- Rollback: drop trigger tg_enforce_guide_verification and function
-- fn_enforce_guide_verification (forward-only repair; nothing else depends on them).

CREATE OR REPLACE FUNCTION public.fn_enforce_guide_verification()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  privileged boolean := (select auth.uid()) IS NULL OR public.is_admin();
BEGIN
  IF privileged THEN
    RETURN NEW;
  END IF;

  -- Non-admin actor (the guide). The verification/moderation columns are read-only
  -- to them, except submitting their own profile for review.
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NOT (OLD.verification_status IN ('draft','rejected')
            AND NEW.verification_status = 'submitted') THEN
      RAISE EXCEPTION
        'Only an administrator can decide verification_status; a guide may only submit for review.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.verification_notes IS DISTINCT FROM OLD.verification_notes THEN
    RAISE EXCEPTION 'verification_notes is set by moderators only.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.attestation_status IS DISTINCT FROM OLD.attestation_status THEN
    RAISE EXCEPTION 'attestation_status is set by moderators only.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_enforce_guide_verification ON public.guide_profiles;
CREATE TRIGGER tg_enforce_guide_verification
  BEFORE UPDATE ON public.guide_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_guide_verification();
