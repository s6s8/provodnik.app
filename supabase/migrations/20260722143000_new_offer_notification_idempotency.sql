-- #46: one in-app «new_offer» notification per offer per traveler.
-- Enforced at the persistence boundary so duplicate guide edits / retries
-- cannot spam the inbox.

CREATE UNIQUE INDEX IF NOT EXISTS notifications_new_offer_once_idx
  ON public.notifications (user_id, entity_id)
  WHERE kind = 'new_offer'::public.notification_kind
    AND entity_id IS NOT NULL;
