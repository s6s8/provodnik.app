-- Item 3 (D17-3) — make the admin location catalogue a real authority boundary.
--
-- 20260719000300 introduced `guide_location_catalog` (admin-only writes, active|retired)
-- and the ready-tour authoring UI already picks `guide_templates.region` from it. But the
-- browser was the ONLY check: a guide holding their own JWT can still POST/PATCH an
-- arbitrary or retired region straight to PostgREST, and the Photobank
-- (`guide_location_photos.location_name`) was still free text on every layer. Move the
-- boundary to the data layer, exactly as ready-tour moderation did in 20260719000200.
--
-- One shared trigger function serves both tables; the governed column comes in as TG_ARGV[0]
-- so there is a single place where "which locations may a guide store" is decided.
--
-- Legacy handling: existing rows are never rewritten or re-validated. Enforcement fires on
-- INSERT, and on UPDATE only when the location column actually changes, so a tour or photo
-- carrying pre-catalogue free text stays readable AND stays editable (price, photos, sort
-- order) — the guide is stopped only when they set a location that is not active today.
-- Blank/NULL keeps its current meaning ("not stated"): this governs WHICH location may be
-- stored, not whether one is required.
CREATE OR REPLACE FUNCTION public.enforce_active_catalog_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  location_column text := TG_ARGV[0];
  new_location text := to_jsonb(NEW) ->> location_column;
  old_location text;
BEGIN
  -- The trusted backend (service role: no JWT → auth.uid() IS NULL) and admins own the
  -- catalogue; they also run seeds/backfills and the moderation queue.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF new_location IS NULL OR btrim(new_location) = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_location := to_jsonb(OLD) ->> location_column;
    -- Compare the way the catalogue's unique index does, so re-saving a legacy value that
    -- only differs in case/whitespace is an unrelated edit, not a location change.
    IF lower(btrim(new_location)) IS NOT DISTINCT FROM lower(btrim(old_location)) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.guide_location_catalog c
     WHERE c.status = 'active'
       AND lower(c.name) = lower(btrim(new_location))
  ) THEN
    RAISE EXCEPTION
      'Локация «%» недоступна: выберите локацию из справочника администратора.', new_location
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_enforce_guide_template_location ON public.guide_templates;
CREATE TRIGGER tg_enforce_guide_template_location
  BEFORE INSERT OR UPDATE ON public.guide_templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_active_catalog_location('region');

DROP TRIGGER IF EXISTS tg_enforce_guide_location_photo_location ON public.guide_location_photos;
CREATE TRIGGER tg_enforce_guide_location_photo_location
  BEFORE INSERT OR UPDATE ON public.guide_location_photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_active_catalog_location('location_name');
