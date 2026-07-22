-- Ready guide excursion → request → accepted offer → booking: keep the template identity.
--
-- A traveler who starts from a published `guide_templates` row (the «Готовая экскурсия»
-- detail page) lost the excursion the moment they pressed the CTA: it only carried the
-- guide's slug, so the request said "some trip with this guide" and the booking that came
-- out of accept_offer had listing_id NULL and no template truth anywhere. The booking
-- detail then had nothing to show as the programme.
--
-- The lineage already exists — bookings.request_id → traveler_requests — so the request is
-- the one place that has to remember. Two nullable columns:
--
--   guide_template_id       the live link, ON DELETE SET NULL
--   guide_template_snapshot the booking truth, frozen at creation
--
-- The snapshot is what the booking renders. It is a snapshot precisely so a later edit (or
-- deletion) of the guide's template cannot rewrite an excursion someone already booked.
--
-- Pairing: `guide_template_id IS NULL OR guide_template_snapshot IS NOT NULL`, i.e. a
-- template link never exists without its truth, and an ordinary request has neither. It is
-- deliberately NOT a strict `(a IS NULL) = (b IS NULL)`: the FK's ON DELETE SET NULL nulls
-- the id on a live row, and a strict pairing would then abort the delete — turning SET NULL
-- into RESTRICT and, worse, making the surviving booking's programme deletable by the guide.
-- Snapshot-without-id is exactly the state a deleted template must leave behind.
--
-- Who may write them is the same question 20260722000300 answered for target_guide_id, and
-- the same answer: not the client. createSupabaseServerClient speaks to PostgREST with the
-- browser's own session, so a caller-supplied snapshot is caller-authored text — it could
-- claim any programme, price scope or participant cap on a real booking. So:
--
--   * traveler_requests_insert forbids both columns on a direct insert;
--   * create_directed_traveler_request reads the template itself and builds the snapshot in
--     SQL, from a *published* template owned by an *approved* guide — the same two gates the
--     public detail page applies — and fails closed otherwise;
--   * the freeze trigger (widened here from target_guide_id) blocks the PATCH-afterwards
--     bypass, while still allowing the FK's own SET NULL.
--
-- Rollback: drop the columns and the constraint, restore the 20260722000300 versions of the
-- policy, the function (without p_guide_template_id) and the trigger.
--
-- PROD: do NOT `supabase db push` (the prod migration ledger is truncated — landmine).
-- Apply as targeted SQL + a manual ledger entry.

begin;

-- 1. The request remembers which ready excursion it came from.
ALTER TABLE public.traveler_requests
  ADD COLUMN IF NOT EXISTS guide_template_id uuid
    REFERENCES public.guide_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guide_template_snapshot jsonb;

ALTER TABLE public.traveler_requests
  DROP CONSTRAINT IF EXISTS traveler_requests_guide_template_paired;

ALTER TABLE public.traveler_requests
  ADD CONSTRAINT traveler_requests_guide_template_paired
  CHECK (guide_template_id IS NULL OR guide_template_snapshot IS NOT NULL);

CREATE INDEX IF NOT EXISTS traveler_requests_guide_template_id_idx
  ON public.traveler_requests (guide_template_id)
  WHERE guide_template_id IS NOT NULL;

COMMENT ON COLUMN public.traveler_requests.guide_template_snapshot IS
  'Booking truth for a ready-excursion request, built server-side from a published guide_template at creation. Never written by a client; frozen afterwards.';

-- 2. A traveler's direct insert stays an ordinary open request: no addressee, and no
--    template identity it could have authored itself.
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
      -- Nor is authoring the excursion the request claims to be for.
      AND guide_template_id IS NULL
      AND guide_template_snapshot IS NULL
    )
    OR public.is_admin()
  );

-- 3. The single writer, now also for the template lineage.
--    Signature change (p_guide_template_id) => drop the old one first; leaving both would
--    make every named-argument call ambiguous.
DROP FUNCTION IF EXISTS public.create_directed_traveler_request(
  text, date, date, uuid, text, text, text[], text[], integer, integer, text, text,
  boolean, integer, time without time zone, time without time zone, text, boolean,
  boolean, boolean, boolean, text
);

CREATE OR REPLACE FUNCTION public.create_directed_traveler_request(
  p_destination text,
  p_starts_on date,
  p_ends_on date,
  p_listing_id uuid DEFAULT NULL,
  p_guide_template_id uuid DEFAULT NULL,
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
  v_uid      uuid := (SELECT auth.uid());
  v_target   uuid;
  v_snapshot jsonb;
  v_row      public.traveler_requests;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  PERFORM public.assert_active_account();

  IF p_guide_template_id IS NOT NULL THEN
    -- A ready excursion has no `listings` row, so the template itself is both the
    -- addressee source and the itinerary source. Ownership decides the addressee — the
    -- slug below is display text the browser handed us, never the authority.
    SELECT t.guide_id,
           jsonb_build_object(
             'id', t.id,
             'title', t.title,
             'description', t.description,
             'duration_text', t.duration_text,
             'meeting_point', t.meeting_point,
             'max_participants', t.max_participants,
             'region', t.region,
             'price_scope', t.price_scope,
             'price_from_kopecks', t.price_from_kopecks
           )
      INTO v_target, v_snapshot
      FROM public.guide_templates t
      JOIN public.guide_profiles gp
        ON gp.user_id = t.guide_id
       AND gp.verification_status = 'approved'::public.guide_verification_status
     WHERE t.id = p_guide_template_id
       AND t.status = 'published';
    IF v_target IS NULL THEN
      RAISE EXCEPTION 'template_unavailable' USING ERRCODE = '42501';
    END IF;

    -- Both halves of the CTA must agree. A slug naming someone other than the template's
    -- owner means the caller is confused or probing; neither deserves a request.
    IF p_preferred_guide_slug IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
           FROM public.guide_profiles gp
          WHERE gp.user_id = v_target
            AND gp.slug = p_preferred_guide_slug
       ) THEN
      RAISE EXCEPTION 'template_guide_mismatch' USING ERRCODE = '42501';
    END IF;
  ELSIF p_listing_id IS NOT NULL THEN
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
    guide_template_id,
    guide_template_snapshot,
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
    p_guide_template_id,
    v_snapshot,
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

-- 4. The addressee and the excursion identity are decided once, at creation.
--
-- RLS WITH CHECK only sees the new row, so it cannot tell "was already directed" from
-- "just became directed" — a trigger is the only place that can compare OLD and NEW.
-- No auth.uid() ⇒ trusted backend (seed / service-role jobs), consistent with
-- fn_enforce_listing_transition.
--
-- guide_template_id may still go to NULL: that is the FK's own ON DELETE SET NULL when a
-- guide deletes the template, and the snapshot it leaves behind is the point.
DROP TRIGGER IF EXISTS trg_freeze_request_target_guide ON public.traveler_requests;
DROP FUNCTION IF EXISTS public.fn_freeze_request_target_guide();

CREATE OR REPLACE FUNCTION public.fn_freeze_request_lineage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.target_guide_id IS DISTINCT FROM OLD.target_guide_id THEN
    RAISE EXCEPTION 'target_guide_id_not_editable' USING ERRCODE = '42501';
  END IF;

  IF NEW.guide_template_id IS NOT NULL
     AND NEW.guide_template_id IS DISTINCT FROM OLD.guide_template_id THEN
    RAISE EXCEPTION 'guide_template_id_not_editable' USING ERRCODE = '42501';
  END IF;

  IF NEW.guide_template_snapshot IS DISTINCT FROM OLD.guide_template_snapshot THEN
    RAISE EXCEPTION 'guide_template_snapshot_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_freeze_request_lineage ON public.traveler_requests;
CREATE TRIGGER trg_freeze_request_lineage
  BEFORE UPDATE OF target_guide_id, guide_template_id, guide_template_snapshot
    ON public.traveler_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_freeze_request_lineage();

COMMENT ON FUNCTION public.create_directed_traveler_request IS
  'Single writer for directed traveler requests. Derives target_guide_id from a published guide_template, a published listing, or an approved guide slug — never from a caller-supplied id — and builds guide_template_snapshot itself, because traveler_requests_insert forbids all three columns on a direct insert.';

REVOKE ALL ON FUNCTION public.create_directed_traveler_request(
  text, date, date, uuid, uuid, text, text, text[], text[], integer, integer, text, text,
  boolean, integer, time without time zone, time without time zone, text, boolean,
  boolean, boolean, boolean, text
) FROM public;

GRANT EXECUTE ON FUNCTION public.create_directed_traveler_request(
  text, date, date, uuid, uuid, text, text, text[], text[], integer, integer, text, text,
  boolean, integer, time without time zone, time without time zone, text, boolean,
  boolean, boolean, boolean, text
) TO authenticated, service_role;

-- Applied by hand in prod (see the header), where a stale PostgREST cache would turn
-- every directed request into "function not found" — the same class of miss as the
-- allow_guide_suggestions column. Cheap to make the reload explicit.
NOTIFY pgrst, 'reload schema';

commit;
