-- #82: keep payment-category help articles out of the public read surface.
-- App flag FEATURE_TR_PAYMENT still gates UI; RLS blocks direct anon/authenticated
-- reads so payment copy cannot leak through a projection accident.

UPDATE public.help_articles
   SET is_published = false
 WHERE category = 'payment';

DROP POLICY IF EXISTS "help_articles_select" ON public.help_articles;

CREATE POLICY "help_articles_select" ON public.help_articles
  FOR SELECT
  USING (
    is_published = true
    AND category IS DISTINCT FROM 'payment'
  );

COMMENT ON POLICY "help_articles_select" ON public.help_articles IS
  'Public read for published non-payment help articles. Payment-category rows require admin publish + app flag before launch.';
