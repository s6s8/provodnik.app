DROP POLICY IF EXISTS "guide_portfolio_public_read" ON storage.objects;
CREATE POLICY "guide_portfolio_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'guide-portfolio');

DROP POLICY IF EXISTS "guide_documents_owner_delete" ON storage.objects;
CREATE POLICY "guide_documents_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'guide-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
