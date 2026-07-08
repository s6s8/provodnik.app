-- Backfill stale traveler "new_offer" notifications that point to a request
-- already represented by a booking. Some legacy QA/prod rows were created
-- before bookings carried request_id/offer_id, so route them by participant pair
-- (traveler = notification.user_id, guide = payload.actor_id) to the newest
-- relevant booking instead of leaving /requests/:id as a dead-end 404.

WITH candidate_notifications AS (
  SELECT
    n.id AS notification_id,
    b.id AS booking_id,
    row_number() OVER (
      PARTITION BY n.id
      ORDER BY b.created_at DESC, b.id DESC
    ) AS rank
  FROM public.notifications n
  JOIN public.bookings b
    ON b.traveler_id = n.user_id
   AND b.guide_id = NULLIF(n.payload ->> 'actor_id', '')::uuid
  WHERE n.kind = 'new_offer'
    AND COALESCE(n.href, '') LIKE '/requests/%'
    AND n.payload ? 'request_id'
    AND n.payload ? 'actor_id'
    AND b.status IN ('confirmed', 'awaiting_guide_confirmation', 'completed')
)
UPDATE public.notifications n
SET
  href = '/bookings/' || c.booking_id::text,
  payload = COALESCE(n.payload, '{}'::jsonb) || jsonb_build_object('booking_id', c.booking_id)
FROM candidate_notifications c
WHERE c.notification_id = n.id
  AND c.rank = 1;
