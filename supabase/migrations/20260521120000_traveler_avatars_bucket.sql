INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('traveler-avatars', 'traveler-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Travelers upload own avatars" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'traveler-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Travelers update own avatars" ON storage.objects FOR UPDATE
  USING (bucket_id = 'traveler-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'traveler-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Travelers read own avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'traveler-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
