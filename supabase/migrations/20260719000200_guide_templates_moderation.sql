-- Item 6 — mandatory admin review for ready tours (guide_templates).
--
-- Ready tours are the live «готовые экскурсии» path (guide_templates), which until now
-- carried only draft|published: the guide self-published with no review. Unify it with
-- the admin moderation model already used for the listings table:
--   draft → pending_review → published | rejected
-- Direct self-publish must be impossible at the UI, the server helper, AND the data
-- boundary. This migration is the data-boundary (3rd) layer.
--
-- Existing published rows are grandfathered (their status is untouched); only writes are
-- constrained. A guide editing a published tour resubmits it to pending_review (the
-- authoring path maps published→pending_review on edit), so nothing goes public unreviewed.

-- 1. Widen the lifecycle.
ALTER TABLE public.guide_templates
  DROP CONSTRAINT IF EXISTS guide_templates_status_check;
ALTER TABLE public.guide_templates
  ADD CONSTRAINT guide_templates_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'));

-- 2. Rejection reason the guide can read on their own row (RLS guide_templates_select_own).
ALTER TABLE public.guide_templates
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Block guide self-publish at the data boundary. A guide (authenticated, non-admin)
--    may only ever leave a template in draft or pending_review. Admins and the trusted
--    backend (service role: no JWT → auth.uid() IS NULL) may set any status.
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

DROP TRIGGER IF EXISTS tg_enforce_guide_template_moderation ON public.guide_templates;
CREATE TRIGGER tg_enforce_guide_template_moderation
  BEFORE INSERT OR UPDATE ON public.guide_templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_guide_template_moderation();

-- 4. Admins can review every template through their own session too (the service-role
--    queue bypasses RLS, but keep the boundary explicit and self-documenting).
DROP POLICY IF EXISTS guide_templates_admin_all ON public.guide_templates;
CREATE POLICY guide_templates_admin_all ON public.guide_templates
  USING (public.is_admin()) WITH CHECK (public.is_admin());
