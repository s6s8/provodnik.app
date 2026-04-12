-- Delivery function: processes pending notifications
CREATE OR REPLACE FUNCTION public.fn_deliver_pending_notifications()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  lock_obtained boolean;
BEGIN
  SELECT pg_try_advisory_lock(hashtext('fn_deliver_pending_notifications')) INTO lock_obtained;
  IF NOT lock_obtained THEN RETURN; END IF;

  -- Mark stale pending notifications as failed (older than 1 hour)
  UPDATE public.notifications
  SET status = 'failed'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour';

  -- in_app notifications are "delivered" immediately (just marked sent)
  UPDATE public.notifications
  SET status = 'sent'
  WHERE status = 'pending'
    AND channel = 'in_app';

  -- Email and telegram channels: mark for external pickup
  -- (actual sending handled by edge function or external script)
  -- Just mark as 'sent' here — external systems poll for sent+channel
  UPDATE public.notifications
  SET status = 'sent'
  WHERE status = 'pending'
    AND channel IN ('email', 'telegram')
    AND created_at > NOW() - INTERVAL '30 minutes';

  PERFORM pg_advisory_unlock(hashtext('fn_deliver_pending_notifications'));
END;
$$;

-- pg_cron: run every 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'deliver-notifications',
      '*/5 * * * *',
      'SELECT public.fn_deliver_pending_notifications()'
    );
  END IF;
END;
$$;

-- Helper: create notification for a user based on their prefs
CREATE OR REPLACE FUNCTION public.fn_notify_user(
  p_user_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_notification_prefs jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  channel_key text;
  channels text[] := ARRAY['in_app', 'email', 'telegram'];
BEGIN
  FOREACH channel_key IN ARRAY channels LOOP
    -- Check pref: default true if key missing
    IF COALESCE((p_notification_prefs->>CONCAT(p_event_type, '.', channel_key))::boolean, true) THEN
      INSERT INTO public.notifications (user_id, event_type, payload, channel, status)
      VALUES (p_user_id, p_event_type, p_payload, channel_key, 'pending');
    END IF;
  END LOOP;
END;
$$;
