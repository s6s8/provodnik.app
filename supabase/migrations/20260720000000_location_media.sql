-- Destination media — one admin-curated, reusable cover per canonical location.
--
-- Public request cards and request heroes currently render `cityImage()`, a branded
-- blue gradient, for every destination. That is the correct *fallback* but a poor
-- default once a curator has a real city photo. Rather than attaching photography to
-- each request (duplicated uploads, no review), media hangs off the canonical
-- `guide_location_catalog` row and is resolved by destination name.
--
-- Boundary: admins are the only writers. Public readers see PUBLISHED rows only, so an
-- unpublished/draft object path never reaches a public page. The bucket is PRIVATE — a
-- public bucket bypasses object RLS entirely, so a guessed draft path would be readable.
-- Every image URL is therefore a short-lived signed URL. Guide-owned Photobank
-- (`guide_location_photos`) is untouched — this is editorial, curator-owned media.
CREATE TABLE IF NOT EXISTS public.location_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.guide_location_catalog(id) ON DELETE CASCADE,
  bucket_id text NOT NULL DEFAULT 'location-media',
  object_path text NOT NULL,
  role text NOT NULL DEFAULT 'cover',
  status text NOT NULL DEFAULT 'draft',
  is_primary boolean NOT NULL DEFAULT false,
  alt_text text,
  caption text,
  source text,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  width integer,
  height integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT location_media_role_check CHECK (role IN ('cover', 'gallery')),
  -- `uploading` is reserved for a record created *before* its signed upload URL is
  -- issued, so a browser that dies mid-upload still leaves a row an admin can cancel
  -- instead of an unmanaged storage object nobody knows about.
  CONSTRAINT location_media_status_check CHECK (status IN ('uploading', 'draft', 'published')),
  CONSTRAINT location_media_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT location_media_byte_size_check CHECK (byte_size > 0 AND byte_size <= 5242880),
  CONSTRAINT location_media_dimensions_check
    CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0)),
  -- The primary flag means "this is the asset the public resolver serves", so it can only
  -- sit on a row the public can actually reach. Without this, unpublishing or demoting a
  -- primary to gallery leaves `is_primary = true` on an invisible row, and the location
  -- then has a primary that resolves to nothing while the unique index blocks a
  -- replacement.
  CONSTRAINT location_media_primary_is_published_cover
    CHECK (NOT is_primary OR (role = 'cover' AND status = 'published'))
);

CREATE UNIQUE INDEX IF NOT EXISTS location_media_object_path_key
  ON public.location_media (bucket_id, object_path);

-- At most one primary per location: the resolver picks a cover without tie-breaking.
CREATE UNIQUE INDEX IF NOT EXISTS location_media_one_primary_per_location
  ON public.location_media (location_id) WHERE is_primary;

CREATE INDEX IF NOT EXISTS location_media_location_idx
  ON public.location_media (location_id, sort_order);

-- Promoting a row to primary demotes its siblings atomically, so the admin console
-- never has to run a two-statement swap that could trip the unique index mid-flight.
CREATE OR REPLACE FUNCTION public.location_media_demote_siblings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.location_media
       SET is_primary = false, updated_at = now()
     WHERE location_id = NEW.location_id
       AND id <> NEW.id
       AND is_primary;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS location_media_primary_guard ON public.location_media;
CREATE TRIGGER location_media_primary_guard
  BEFORE INSERT OR UPDATE ON public.location_media
  FOR EACH ROW EXECUTE FUNCTION public.location_media_demote_siblings();

ALTER TABLE public.location_media ENABLE ROW LEVEL SECURITY;

-- Public read is limited to published media. Admins additionally see drafts.
DROP POLICY IF EXISTS location_media_published_read ON public.location_media;
CREATE POLICY location_media_published_read ON public.location_media
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS location_media_admin_write ON public.location_media;
CREATE POLICY location_media_admin_write ON public.location_media
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.location_media TO anon, authenticated;
GRANT ALL ON TABLE public.location_media TO service_role;

-- Dedicated PRIVATE bucket (mirrors src/lib/storage/buckets.ts). Private is load-bearing:
-- a public bucket serves every object by path with no policy check, which would expose
-- `uploading`/`draft` files to anyone who guesses or once saw a path.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('location-media', 'location-media', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

-- Object-level boundary. Uploads run through a service-role signed URL (which bypasses
-- RLS), so these policies exist to stop a signed-in non-admin writing to the bucket
-- directly with their own token.
--
-- SELECT is what gates *minting a signed URL*, so it is deliberately narrow: an object is
-- readable only when a published, primary `cover` row points at it. Drafts, uploading
-- records, gallery assets and demoted covers stay admin-only.
DROP POLICY IF EXISTS location_media_objects_public_read ON storage.objects;
CREATE POLICY location_media_objects_public_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'location-media'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
          FROM public.location_media m
         WHERE m.bucket_id = storage.objects.bucket_id
           AND m.object_path = storage.objects.name
           AND m.status = 'published'
           AND m.role = 'cover'
           AND m.is_primary
      )
    )
  );

DROP POLICY IF EXISTS location_media_objects_admin_write ON storage.objects;
CREATE POLICY location_media_objects_admin_write ON storage.objects
  USING (bucket_id = 'location-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'location-media' AND public.is_admin());
