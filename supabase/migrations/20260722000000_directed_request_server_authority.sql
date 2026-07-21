-- Item 8 follow-up — the directed-request addressee must be chosen by the database.
--
-- 20260719000400 made target_guide_id the privacy authority for a directed request,
-- and 3d5dfb51 taught the app to derive it server-side (listing.guide_id, or a slug
-- resolved to a guide). That is not a boundary: createSupabaseServerClient talks to
-- PostgREST with the *browser's own* anon key + user session, and
-- traveler_requests_insert only checks traveler_id + account status. The same token
-- can therefore POST /rest/v1/traveler_requests directly with any target_guide_id it
-- likes — pick an arbitrary guide, hide the request from public discovery, and drop it
-- into that guide's private inbox. App-layer derivation cannot stop that.
--
-- Close it at the authorization boundary, in two halves:
--
--   1. RLS: a traveler's *direct* insert may only create an ordinary open request
--      (target_guide_id IS NULL). Admins keep full authority.
--   2. create_directed_traveler_request(): the only writer that can set the column RLS
--      now forbids. SECURITY DEFINER, and it derives the addressee itself — from a
--      published listing, or from a slug resolved to an *approved* guide. It never
--      accepts a guide/user id from the caller, so no raw client id can become a target.
--   3. A trigger freezes target_guide_id after creation. traveler_requests_update lets
--      the owner edit any column of their own request, so without this the same token
--      just inserts an ordinary request and PATCHes the addressee in afterwards — the
--      identical bypass through the next door. Nothing in the app ever rewrites the
--      column, so freezing it costs nothing.
--
-- The account-status gate that the insert policy enforces is re-asserted inside the
-- function (assert_active_account), because SECURITY DEFINER skips the policy.
--
-- Rollback: drop the function and the trigger, then restore the previous WITH CHECK (the
-- pre-image is 20260706093000_enforce_active_traveler_request_mutations.sql).
--
-- PROD: do NOT `supabase db push` (the prod migration ledger is truncated — landmine).
-- Apply as targeted SQL + a manual ledger entry.

begin;

-- 1. Direct traveler inserts are ordinary open requests only.
DROP POLICY IF EXISTS "traveler_requests_insert" ON public.traveler_requests;

CREATE POLICY "traveler_requests_insert" ON public.traveler_requests
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for(traveler_id) = 'active'::public.account_status
      -- A directed request is private to the addressed guide. Choosing that addressee
      -- is not the client's authority: it goes through create_directed_traveler_request.
      AND target_guide_id IS NULL
    )
    OR public.is_admin()
  );

-- 2. The single writer for directed requests.
--
-- Parameters mirror the insert columns the app already controls; the security-critical
-- fields (traveler_id, target_guide_id, status, id, timestamps) are set here, never by
-- the caller. p_listing_id and p_preferred_guide_slug are *derivation sources*, not
-- targets: the function looks the addressee up itself and fails closed if it cannot.
CREATE OR REPLACE FUNCTION public.create_directed_traveler_request(
  p_destination text,
  p_starts_on date,
  p_ends_on date,
  p_listing_id uuid DEFAULT NULL,
  p_preferred_guide_slug text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_interests text[] DEFAULT '{}'::text[],
  p_requested_languages text[] DEFAULT '{}'::text[],
  p_budget_minor integer DEFAULT NULL,
  p_participants_count integer DEFAULT 1,
  p_format_preference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_open_to_join boolean DEFAULT false,
  p_group_capacity integer DEFAULT NULL,
  p_start_time time without time zone DEFAULT NULL,
  p_end_time time without time zone DEFAULT NULL,
  p_date_flexibility text DEFAULT 'exact',
  p_date_locked boolean DEFAULT true,
  p_time_locked boolean DEFAULT true,
  p_count_locked boolean DEFAULT true,
  p_budget_locked boolean DEFAULT true,
  p_date_window text DEFAULT 'week'
)
RETURNS public.traveler_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid    uuid := (SELECT auth.uid());
  v_target uuid;
  v_row    public.traveler_requests;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  PERFORM public.assert_active_account();

  IF p_listing_id IS NOT NULL THEN
    -- A request started from a ready excursion belongs to that excursion's guide.
    SELECT l.guide_id INTO v_target
      FROM public.listings l
     WHERE l.id = p_listing_id
       AND l.status = 'published'::public.listing_status;
    IF v_target IS NULL THEN
      RAISE EXCEPTION 'listing_unavailable' USING ERRCODE = '42501';
    END IF;
  ELSIF p_preferred_guide_slug IS NOT NULL THEN
    -- The slug is display-only text from the client; only an approved guide it
    -- resolves to may become the addressee.
    SELECT gp.user_id INTO v_target
      FROM public.guide_profiles gp
     WHERE gp.slug = p_preferred_guide_slug
       AND gp.verification_status = 'approved'::public.guide_verification_status;
    IF v_target IS NULL THEN
      RAISE EXCEPTION 'target_guide_unresolved' USING ERRCODE = '42501';
    END IF;
  ELSE
    -- No derivation source => nothing to address. Ordinary open requests use the
    -- normal insert path; they must not reach this function.
    RAISE EXCEPTION 'target_source_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.traveler_requests (
    traveler_id,
    target_guide_id,
    destination,
    region,
    interests,
    requested_languages,
    starts_on,
    ends_on,
    budget_minor,
    currency,
    participants_count,
    format_preference,
    notes,
    open_to_join,
    group_capacity,
    preferred_guide_slug,
    start_time,
    end_time,
    date_flexibility,
    date_locked,
    time_locked,
    count_locked,
    budget_locked,
    date_window
  ) VALUES (
    v_uid,
    v_target,
    p_destination,
    p_region,
    COALESCE(p_interests, '{}'::text[]),
    COALESCE(p_requested_languages, '{}'::text[]),
    p_starts_on,
    COALESCE(p_ends_on, p_starts_on),
    p_budget_minor,
    'RUB',
    COALESCE(p_participants_count, 1),
    p_format_preference,
    p_notes,
    COALESCE(p_open_to_join, false),
    p_group_capacity,
    p_preferred_guide_slug,
    p_start_time,
    p_end_time,
    COALESCE(p_date_flexibility, 'exact'),
    COALESCE(p_date_locked, true),
    COALESCE(p_time_locked, true),
    COALESCE(p_count_locked, true),
    COALESCE(p_budget_locked, true),
    COALESCE(p_date_window, 'week')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

-- 3. The addressee is decided once, at creation.
--
-- RLS WITH CHECK only sees the new row, so it cannot tell "was already directed" from
-- "just became directed" — a trigger is the only place that can compare OLD and NEW.
-- No auth.uid() ⇒ trusted backend (seed / service-role jobs), consistent with
-- fn_enforce_listing_transition.
CREATE OR REPLACE FUNCTION public.fn_freeze_request_target_guide()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.target_guide_id IS DISTINCT FROM OLD.target_guide_id
     AND (SELECT auth.uid()) IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'target_guide_id_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_freeze_request_target_guide ON public.traveler_requests;
CREATE TRIGGER trg_freeze_request_target_guide
  BEFORE UPDATE OF target_guide_id ON public.traveler_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_freeze_request_target_guide();

COMMENT ON FUNCTION public.create_directed_traveler_request IS
  'Single writer for directed traveler requests. Derives target_guide_id from a published listing or an approved guide slug — never from a caller-supplied id — because traveler_requests_insert forbids a non-null target on a direct insert.';

REVOKE ALL ON FUNCTION public.create_directed_traveler_request(
  text, date, date, uuid, text, text, text[], text[], integer, integer, text, text,
  boolean, integer, time without time zone, time without time zone, text, boolean,
  boolean, boolean, boolean, text
) FROM public;

GRANT EXECUTE ON FUNCTION public.create_directed_traveler_request(
  text, date, date, uuid, text, text, text[], text[], integer, integer, text, text,
  boolean, integer, time without time zone, time without time zone, text, boolean,
  boolean, boolean, boolean, text
) TO authenticated, service_role;

-- Applied by hand in prod (see the header), where a stale PostgREST cache would turn
-- every directed request into "function not found" — the same class of miss as the
-- allow_guide_suggestions column. Cheap to make the reload explicit.
NOTIFY pgrst, 'reload schema';

commit;
