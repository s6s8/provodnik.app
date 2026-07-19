-- Item 3 — admin-approved location catalogue for guide listings + photobank.
--
-- Guides currently type a free-text «Регион» on ready tours and a free-text location on
-- photobank uploads («отсебятина»). Introduce a canonical, admin-controlled catalogue:
-- admins add / retire locations; guides pick an active canonical location instead of
-- typing arbitrary text.
--
-- Scope: this is the GUIDE-authored catalogue only. Traveler destination discovery
-- (the broad global typeahead in the request form) is a separate, deliberately assistive
-- system and is NOT touched — real global destinations must not collapse to a short list.
--
-- Legacy handling: existing free-text values already stored on guide_templates.region /
-- guide_location_photos.location_name keep rendering (display continuity). We seed the
-- ACTIVE catalogue only from regions that are already published on live tours (already
-- reviewed by being public) plus a small canonical starter set, so guides are never
-- blocked. Unreviewed free text is never auto-promoted to canonical.
CREATE TABLE IF NOT EXISTS public.guide_location_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT guide_location_catalog_status_check CHECK (status IN ('active', 'retired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS guide_location_catalog_name_key
  ON public.guide_location_catalog (lower(name));

ALTER TABLE public.guide_location_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone may read the catalogue (guides pick from it; it is not sensitive).
DROP POLICY IF EXISTS guide_location_catalog_read ON public.guide_location_catalog;
CREATE POLICY guide_location_catalog_read ON public.guide_location_catalog
  FOR SELECT USING (true);

-- Only admins add / retire / edit locations — enforced at the data boundary.
DROP POLICY IF EXISTS guide_location_catalog_admin_write ON public.guide_location_catalog;
CREATE POLICY guide_location_catalog_admin_write ON public.guide_location_catalog
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT ALL ON TABLE public.guide_location_catalog TO anon, authenticated, service_role;

-- Seed active catalogue from already-published tour regions (already-reviewed data).
INSERT INTO public.guide_location_catalog (name, status)
SELECT DISTINCT ON (lower(trim(region))) trim(region), 'active'
  FROM public.guide_templates
 WHERE region IS NOT NULL AND trim(region) <> '' AND status = 'published'
ON CONFLICT (lower(name)) DO NOTHING;

-- Small canonical starter set so guides in regions with no published tour yet are not blocked.
INSERT INTO public.guide_location_catalog (name, status)
SELECT v.name, 'active'
  FROM (VALUES
    ('Москва'), ('Санкт-Петербург'), ('Казань'), ('Калининград'),
    ('Сочи'), ('Екатеринбург'), ('Нижний Новгород'), ('Владивосток')
  ) AS v(name)
ON CONFLICT (lower(name)) DO NOTHING;
