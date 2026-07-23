-- Task #94 — guides choose per-group or per-person pricing when authoring a ready tour.
--
-- 20260722000000_guide_template_price_scope_guard.sql forced every authenticated
-- create/update to per_group. The product now exposes an explicit «за группу» /
-- «за человека» choice in the guide form. The CHECK constraint on price_scope
-- remains the authority; legacy rows keep their stored scope.

DROP TRIGGER IF EXISTS tg_enforce_guide_template_price_scope ON public.guide_templates;
DROP FUNCTION IF EXISTS public.enforce_guide_template_price_scope();

COMMENT ON COLUMN public.guide_templates.price_scope IS
  'per_person = amount is per traveler; per_group = amount covers the whole group. New rows default to per_group when omitted.';
