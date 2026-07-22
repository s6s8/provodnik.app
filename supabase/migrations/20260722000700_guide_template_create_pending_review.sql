-- Issue #37: every new guide-created ready tour must enter pending_review.
--
-- The column default was still `draft`, and the moderation trigger allowed guides to
-- insert an explicit draft — both let new tours bypass the admin queue. Grandfather
-- existing rows; force every authenticated guide INSERT to pending_review regardless
-- of the supplied status. Only admins/service-role may publish or reject.

ALTER TABLE public.guide_templates
  ALTER COLUMN status SET DEFAULT 'pending_review';

COMMENT ON COLUMN public.guide_templates.status IS
  'Ready-tour lifecycle: draft | pending_review | published | rejected. New guide rows always land in pending_review; only admins/service-role may publish or reject.';

CREATE OR REPLACE FUNCTION public.enforce_guide_template_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending_review';
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('draft', 'pending_review') THEN
    RAISE EXCEPTION 'Готовые экскурсии публикуются только после проверки администратором.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
