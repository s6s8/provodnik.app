-- #35 — Suspended/archived users must not mutate data within their access-token
-- TTL window. RLS is the security boundary (route guards run only on role-gated
-- routes; public-site actions skip them). Earlier migrations gated request
-- create/join (20260706093000), guide offers (20260702143000) and the write RPCs
-- (20260706120000). This closes the remaining direct-write policies, mirroring
-- that pattern: the acting user (auth.uid()) must be 'active', or be an admin.
--
-- We check the actor's status via profile_account_status_for(auth.uid()); in every
-- non-admin branch below auth.uid() already equals the owning column, so this is
-- equivalent to (and simpler than) repeating the owner id. Admins/service role are
-- never blocked. NOT applied to prod here — file only; apply via targeted SQL +
-- ledger repair (never `supabase db push` on prod).

-- messages_insert: booking/dispute chat inserts (conversations.ts sendMessage is a
-- direct insert, not the guarded RPC). Preserve the participant rule; add the
-- active-account gate and an is_admin() escape hatch (previously absent).
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) IS NOT NULL
      AND sender_id = (SELECT auth.uid())
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      AND public.is_thread_participant(thread_id)
    )
    OR public.is_admin()
  );

-- traveler_requests_update: edit/cancel of own request.
DROP POLICY IF EXISTS "traveler_requests_update" ON public.traveler_requests;
CREATE POLICY "traveler_requests_update" ON public.traveler_requests
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

-- listings_insert / listings_update: guide creating/editing excursion listings.
DROP POLICY IF EXISTS "listings_insert" ON public.listings;
CREATE POLICY "listings_insert" ON public.listings
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "listings_update" ON public.listings;
CREATE POLICY "listings_update" ON public.listings
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

-- review_replies_insert / review_replies_update: guide replying to reviews.
DROP POLICY IF EXISTS "review_replies_insert" ON public.review_replies;
CREATE POLICY "review_replies_insert" ON public.review_replies
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "review_replies_update" ON public.review_replies;
CREATE POLICY "review_replies_update" ON public.review_replies
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

-- bookings_update: either party mutating a booking (cancel/confirm). The actor is
-- auth.uid(); block if the acting party is suspended.
DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  USING (
    (
      ((SELECT auth.uid()) = traveler_id OR (SELECT auth.uid()) = guide_id)
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      ((SELECT auth.uid()) = traveler_id OR (SELECT auth.uid()) = guide_id)
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

-- dispute_events_insert: posting into a dispute timeline.
DROP POLICY IF EXISTS "dispute_events_insert" ON public.dispute_events;
CREATE POLICY "dispute_events_insert" ON public.dispute_events
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1
        FROM public.disputes d
        JOIN public.bookings b ON b.id = d.booking_id
        WHERE d.id = dispute_events.dispute_id
          AND (b.traveler_id = (SELECT auth.uid()) OR b.guide_id = (SELECT auth.uid()))
      )
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

-- guide_profiles / guide_documents / guide_licenses: guide editing profile or
-- (re)submitting verification while suspended.
DROP POLICY IF EXISTS "guide_profiles_update" ON public.guide_profiles;
CREATE POLICY "guide_profiles_update" ON public.guide_profiles
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) IS NOT NULL
      AND (SELECT auth.uid()) = user_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) IS NOT NULL
      AND (SELECT auth.uid()) = user_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "guide_documents_insert" ON public.guide_documents;
CREATE POLICY "guide_documents_insert" ON public.guide_documents
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "guide_documents_update" ON public.guide_documents;
CREATE POLICY "guide_documents_update" ON public.guide_documents
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "guide_licenses_insert" ON public.guide_licenses;
CREATE POLICY "guide_licenses_insert" ON public.guide_licenses
  FOR INSERT
  WITH CHECK (
    (
      guide_id = (SELECT auth.uid())
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "guide_licenses_update" ON public.guide_licenses;
CREATE POLICY "guide_licenses_update" ON public.guide_licenses
  FOR UPDATE
  USING (
    (
      guide_id = (SELECT auth.uid())
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      guide_id = (SELECT auth.uid())
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  );
