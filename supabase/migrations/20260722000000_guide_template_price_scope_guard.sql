-- D17-2 — a newly created ready tour is priced per GROUP, at the data boundary.
--
-- 20260719000100 added guide_templates.price_scope with DEFAULT 'per_person' so the
-- legacy backfill kept its historic meaning. That backfill is done, but the "new tours
-- are per_group" half of the rule lived only in the browser client
-- (src/lib/supabase/guide-templates.ts). Any direct authenticated write — omitting the
-- column, or passing 'per_person' outright — still produced a per-person ready tour
-- whose public card says «за одного» while the guide authored «Цена за группу».
-- That is a silent money reinterpretation, so the boundary has to be the database.
--
-- Legacy rows are NOT reinterpreted: this constrains writes only. An existing
-- per_person tour keeps its scope and stays fully editable (title, price, photos,
-- moderation status) — its price_scope simply cannot move, and may only ever be
-- corrected forward to per_group.

-- 1. The default now states the canon: a row that does not mention price_scope is
--    per group. Defaults apply to new rows only; nothing existing changes.
ALTER TABLE public.guide_templates
  ALTER COLUMN price_scope SET DEFAULT 'per_group';

-- 2. Reject invalid direct input rather than server-normalising it: a caller that
--    explicitly asked for 'per_person' money must be told no, not silently overruled.
--    The trusted backend (service role: no JWT → auth.uid() IS NULL) is exempt so
--    backfills and fixtures can still seed historic rows.
CREATE OR REPLACE FUNCTION public.enforce_guide_template_price_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.price_scope <> 'per_group' THEN
      RAISE EXCEPTION 'Готовая экскурсия создаётся с ценой за группу (price_scope = per_group).'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.price_scope IS DISTINCT FROM OLD.price_scope
        AND NEW.price_scope <> 'per_group' THEN
    RAISE EXCEPTION 'Цену готовой экскурсии нельзя перевести на расчёт за человека.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_guide_template_price_scope ON public.guide_templates;
CREATE TRIGGER tg_enforce_guide_template_price_scope
  BEFORE INSERT OR UPDATE ON public.guide_templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_guide_template_price_scope();

COMMENT ON COLUMN public.guide_templates.price_scope IS
  'per_person = legacy amount is per traveler (existing rows only, immutable); per_group = amount covers the whole group. New ready tours must be per_group.';
