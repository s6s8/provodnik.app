-- Plan 23 T1: public bucket for guide portfolio photos
-- guide-media (private) stays for verification documents; portfolio photos are public-facing

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guide-portfolio',
  'guide-portfolio',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Guides upload to their own folder (first path segment = auth.uid())
CREATE POLICY "guide_portfolio_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'guide-portfolio'
    AND split_part(name, '/', 1) = (SELECT auth.uid()::text)
  );

-- Guides and admins can replace/update their own files
CREATE POLICY "guide_portfolio_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'guide-portfolio'
    AND (split_part(name, '/', 1) = (SELECT auth.uid()::text) OR public.is_admin())
  );

-- Guides and admins can delete their own files
CREATE POLICY "guide_portfolio_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'guide-portfolio'
    AND (split_part(name, '/', 1) = (SELECT auth.uid()::text) OR public.is_admin())
  );
