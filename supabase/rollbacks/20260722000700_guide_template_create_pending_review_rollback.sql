-- Rollback for 20260722000700_guide_template_create_pending_review.sql

ALTER TABLE public.guide_templates
  ALTER COLUMN status SET DEFAULT 'draft';

COMMENT ON COLUMN public.guide_templates.status IS NULL;

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
  IF NEW.status NOT IN ('draft', 'pending_review') THEN
    RAISE EXCEPTION 'Готовые экскурсии публикуются только после проверки администратором.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
