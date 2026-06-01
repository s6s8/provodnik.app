-- Allow guides to select conversation threads linked to their bookings
CREATE POLICY "guide_select_booking_thread"
  ON conversation_threads
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE guide_id = auth.uid()
    )
  );

-- Allow guides to select messages in their booking threads
CREATE POLICY "guide_select_booking_messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM conversation_threads
      WHERE booking_id IN (
        SELECT id FROM bookings WHERE guide_id = auth.uid()
      )
    )
  );
