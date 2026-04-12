-- guide_licenses: metadata per guide; listing_licenses.license_id references this row
CREATE TABLE IF NOT EXISTS public.guide_licenses (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_type text NOT NULL,
  license_number text NOT NULL,
  issued_by text NOT NULL,
  valid_until date,
  scope_mode text NOT NULL DEFAULT 'selected' CHECK (scope_mode IN ('all', 'selected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guide_licenses_guide_id_idx ON public.guide_licenses (guide_id);

ALTER TABLE public.guide_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_licenses_select" ON public.guide_licenses FOR SELECT
  USING (guide_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "guide_licenses_insert" ON public.guide_licenses FOR INSERT
  WITH CHECK (guide_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "guide_licenses_delete" ON public.guide_licenses FOR DELETE
  USING (guide_id = (SELECT auth.uid()) OR public.is_admin());

-- Enforce license rows belong to a real guide_licenses record
ALTER TABLE public.listing_licenses
  DROP CONSTRAINT IF EXISTS listing_licenses_license_id_fkey;

ALTER TABLE public.listing_licenses
  ADD CONSTRAINT listing_licenses_license_id_fkey
  FOREIGN KEY (license_id) REFERENCES public.guide_licenses(id) ON DELETE CASCADE;
