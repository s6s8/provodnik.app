INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('guide-avatars', 'guide-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('guide-documents', 'guide-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('listing-media', 'listing-media', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('dispute-evidence', 'dispute-evidence', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: owners can upload to their own folder
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('guide-avatars','guide-documents','listing-media','dispute-evidence')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Public buckets readable" ON storage.objects FOR SELECT
  USING (bucket_id IN ('guide-avatars','listing-media'));

CREATE POLICY "Private files visible to owner" ON storage.objects FOR SELECT
  USING (bucket_id IN ('guide-documents','dispute-evidence')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Admins see all files" ON storage.objects FOR SELECT
  USING ((SELECT public.is_admin()));
