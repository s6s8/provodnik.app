CREATE POLICY "guides_read_requester_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  is_guide() AND
  EXISTS (
    SELECT 1 FROM traveler_requests
    WHERE traveler_id = profiles.id AND status = 'open'
  )
);
