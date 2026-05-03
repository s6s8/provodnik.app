-- F002 / T030.2 — "Задать вопрос" returns HTTP 500
--
-- Root cause: 20260401100000_messaging_rls_realtime.sql replaced the canonical
-- conversation_threads_select policy (which used can_access_conversation_thread)
-- with a stricter is_thread_participant(id) check. For offer-linked QA threads,
-- no thread_participants row is ever inserted, so:
--   1. Server action calls getOrCreateOfferQaThread(offerId, userId)
--   2. INSERT into conversation_threads passes (creator + can_access_offer_thread)
--   3. The implicit RETURNING/SELECT step fails the SELECT policy
--   4. .select("id").single() returns no rows → action throws → HTTP 500
--
-- Same regression breaks SELECT on messages for offer-linked QA threads
-- (getQaMessages on page load — currently swallowed by try/catch but still
-- silently hides QA history).
--
-- Fix: additive SELECT policies for offer-linked threads + their messages,
-- mirroring the booking fix from 20260503000001_fix_conversation_thread_rls.sql.
-- The existing can_access_offer_thread() helper already validates that the
-- caller is either the offer's guide or the request's traveler.

CREATE POLICY "select_offer_thread_via_helper"
  ON conversation_threads
  FOR SELECT
  TO authenticated
  USING (
    subject_type = 'offer'
    AND offer_id IS NOT NULL
    AND public.can_access_offer_thread(offer_id, (SELECT auth.uid()::uuid))
  );

CREATE POLICY "select_offer_thread_messages_via_helper"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id
      FROM conversation_threads
      WHERE subject_type = 'offer'
        AND offer_id IS NOT NULL
        AND public.can_access_offer_thread(offer_id, (SELECT auth.uid()::uuid))
    )
  );
