-- Travelers were getting 42501 on /traveler/bookings/:id because the existing
-- conversation_threads_select and messages_select policies only allow access via
-- is_thread_participant(), which doesn't cover travelers whose booking has a thread
-- but who haven't yet been added to participants.
-- These additive SELECT policies allow travelers to read threads linked to their bookings.

CREATE POLICY "traveler_select_booking_thread"
  ON conversation_threads
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE traveler_id = auth.uid()
    )
  );

CREATE POLICY "traveler_select_booking_messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM conversation_threads
      WHERE booking_id IN (
        SELECT id FROM bookings WHERE traveler_id = auth.uid()
      )
    )
  );
