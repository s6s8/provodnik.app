-- Destination media, security repair: revocable delivery copies + a cancel/confirm CAS.
--
-- (1) REVOCATION. The previous design signed the *original* private object and relied on
-- the object SELECT policy to gate who could mint that URL. That gates minting, not the
-- minted token: a Supabase signed URL is a self-contained JWT, so an already-issued
-- 3600s URL keeps serving the object after the row is demoted, unpublished or deleted.
-- No policy change and no shorter TTL closes that window — only removing the bytes does.
--
-- So a published primary cover is now served from a SEPARATE delivery object, copied from
-- the original and tracked in `delivery_object_path`. The original is never public and
-- never signed for a public caller. Demote/unpublish/delete deletes the delivery object
-- first; any outstanding signed URL for it is dead the moment those bytes are gone, and
-- the original was never reachable in the first place.
--
-- The check constraint makes "is primary" and "has a delivery copy" the same fact, so the
-- database cannot hold a primary with no live copy, nor a copy no row will ever revoke.
--
-- (2) CANCEL/CONFIRM RACE. `cancelling` is a new terminal-ish state so cancel can take the
-- row out of `uploading` by compare-and-swap *before* touching storage. Previously cancel
-- read the object path, then removed bytes, then deleted `WHERE status = 'uploading'` — a
-- confirm interleaving between the read and the remove produced a `draft` row whose bytes
-- had been deleted underneath it. Now confirm and cancel contend for the same single
-- `uploading -> x` transition and exactly one wins.

ALTER TABLE public.location_media
  ADD COLUMN IF NOT EXISTS delivery_object_path text;

-- Existing primaries predate delivery copies, so none of them has one. Demote rather than
-- backfill: fabricating a copy here would publish bytes this migration cannot verify.
-- Curators re-promote from the console, which creates the copy through the normal path.
UPDATE public.location_media SET is_primary = false WHERE is_primary;

ALTER TABLE public.location_media
  DROP CONSTRAINT IF EXISTS location_media_status_check;
ALTER TABLE public.location_media
  ADD CONSTRAINT location_media_status_check
  CHECK (status IN ('uploading', 'cancelling', 'draft', 'published'));

-- A primary has a delivery copy and a delivery copy belongs to a primary — one biconditional
-- so neither half can drift. Combined with the existing published-cover check, a delivery
-- object exists exactly while the public is entitled to read it.
ALTER TABLE public.location_media
  DROP CONSTRAINT IF EXISTS location_media_delivery_matches_primary;
ALTER TABLE public.location_media
  ADD CONSTRAINT location_media_delivery_matches_primary
  CHECK ((delivery_object_path IS NOT NULL) = is_primary);

-- A delivery copy is a distinct object, never an alias for the original.
ALTER TABLE public.location_media
  DROP CONSTRAINT IF EXISTS location_media_delivery_is_distinct;
ALTER TABLE public.location_media
  ADD CONSTRAINT location_media_delivery_is_distinct
  CHECK (delivery_object_path IS NULL OR delivery_object_path <> object_path);

CREATE UNIQUE INDEX IF NOT EXISTS location_media_delivery_object_path_key
  ON public.location_media (bucket_id, delivery_object_path)
  WHERE delivery_object_path IS NOT NULL;

-- Public object reads now point at the delivery copy only. The original stays admin-only
-- forever, so no public caller can ever hold a signed URL to it — revoked or not.
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
           AND m.delivery_object_path = storage.objects.name
           AND m.status = 'published'
           AND m.role = 'cover'
           AND m.is_primary
      )
    )
  );
