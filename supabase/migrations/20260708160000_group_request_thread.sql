-- #42 — Open-group shared discussion. The request-subject conversation thread is
-- already scaffolded (thread_subject enum, conversation_threads check constraint,
-- ct_request_unique_idx, can_access_/can_create_conversation_thread) but joined
-- members were never granted access, and messages_insert only allowed enrolled
-- thread_participants. This wires the group forum:
--   1. can_access_request_thread now includes joined open_request_members, so the
--      request owner + joined members (+ existing bidding/viewing guides + admin)
--      can read the thread and create it (can_create_conversation_thread reuses
--      this predicate). Offer-level private QA threads are unchanged.
--   2. messages_insert permits request-subject-thread posts by anyone with
--      can_access_conversation_thread (i.e. members), while offer/booking/dispute
--      threads keep the strict is_thread_participant rule. The active-account and
--      is_admin() guards from 20260708150000 are preserved.
--
-- NOT applied to prod here — file only; apply via targeted SQL + ledger repair.

-- 1. Grant joined members access to the request thread.
CREATE OR REPLACE FUNCTION public.can_access_request_thread(
  target_request_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(target_user_id, (select auth.uid()::uuid)) is not null
    and exists (
      select 1
        from public.traveler_requests tr
       where tr.id = target_request_id
         and (
           tr.traveler_id = coalesce(target_user_id, (select auth.uid()::uuid))
           or public.user_has_role(
             coalesce(target_user_id, (select auth.uid()::uuid)),
             'admin'::public.app_role
           )
           or exists (
             select 1
               from public.guide_offers go
              where go.request_id = tr.id
                and go.guide_id = coalesce(target_user_id, (select auth.uid()::uuid))
           )
           or exists (
             select 1
               from public.request_views rv
              where rv.request_id = tr.id
                and rv.guide_id = coalesce(target_user_id, (select auth.uid()::uuid))
           )
           or exists (
             select 1
               from public.open_request_members m
              where m.request_id = tr.id
                and m.traveler_id = coalesce(target_user_id, (select auth.uid()::uuid))
                and m.status = 'joined'::public.member_status
           )
         )
    );
$$;

-- 2. Allow member posts into the request-subject group thread. Other subjects
--    keep the strict participant rule.
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) IS NOT NULL
      AND sender_id = (SELECT auth.uid())
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      AND (
        public.is_thread_participant(thread_id)
        OR EXISTS (
          SELECT 1
            FROM public.conversation_threads ct
           WHERE ct.id = messages.thread_id
             AND ct.subject_type = 'request'::public.thread_subject
             AND public.can_access_conversation_thread(ct.id, (SELECT auth.uid()))
        )
      )
    )
    OR public.is_admin()
  );
