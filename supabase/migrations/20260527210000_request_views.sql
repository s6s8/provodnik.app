-- request_views: track distinct guide views on traveler requests so the request
-- detail page can surface a popularity signal ("Просмотрено X гидами") alongside
-- the competing-offers count. SECURITY DEFINER RPC bypasses RLS so guides see an
-- aggregate count without reading other guides' rows.

CREATE TABLE IF NOT EXISTS public.request_views (
  request_id uuid NOT NULL REFERENCES public.traveler_requests(id) ON DELETE CASCADE,
  guide_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_request_views_request_id ON public.request_views (request_id);

ALTER TABLE public.request_views ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_request_view(p_request_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_user IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.guide_profiles WHERE user_id = v_user) THEN
    INSERT INTO public.request_views (request_id, guide_id, viewed_at)
    VALUES (p_request_id, v_user, now())
    ON CONFLICT (request_id, guide_id) DO UPDATE SET viewed_at = EXCLUDED.viewed_at;
  END IF;

  SELECT count(DISTINCT guide_id)::integer INTO v_count
  FROM public.request_views
  WHERE request_id = p_request_id;

  RETURN COALESCE(v_count, 0);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.record_request_view(uuid) TO authenticated, anon;
