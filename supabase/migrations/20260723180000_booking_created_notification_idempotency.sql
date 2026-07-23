-- #50: one in-app «booking_created» notification per booking per guide.
-- Dedupe historical duplicates, then enforce at the persistence boundary so
-- duplicate accept retries / parallel callers cannot spam the inbox.

-- Keep the earliest notification per (guide, booking); drop only true duplicates.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, entity_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.notifications
  WHERE kind = 'booking_created'::public.notification_kind
    AND entity_id IS NOT NULL
)
DELETE FROM public.notifications n
USING ranked r
WHERE n.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_booking_created_once_idx
  ON public.notifications (user_id, entity_id)
  WHERE kind = 'booking_created'::public.notification_kind
    AND entity_id IS NOT NULL;
