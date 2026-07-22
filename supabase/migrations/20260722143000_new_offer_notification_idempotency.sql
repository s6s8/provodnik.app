-- #46: one in-app «new_offer» notification per offer per traveler.
-- Dedupe historical duplicates, then enforce at the persistence boundary so
-- duplicate guide edits / retries cannot spam the inbox.

-- Keep the earliest notification per (traveler, offer); drop only true duplicates.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, entity_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.notifications
  WHERE kind = 'new_offer'::public.notification_kind
    AND entity_id IS NOT NULL
)
DELETE FROM public.notifications n
USING ranked r
WHERE n.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_new_offer_once_idx
  ON public.notifications (user_id, entity_id)
  WHERE kind = 'new_offer'::public.notification_kind
    AND entity_id IS NOT NULL;
