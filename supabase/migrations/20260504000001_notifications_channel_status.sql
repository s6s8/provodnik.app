-- Add channel/status/read_at columns to notifications (Plan 59 T060)
-- Fixes T058-F001 (P0) + T058-F002 (P1) — code uses these columns since
-- Plan 47 (T047 notifications inbox refactor); the corresponding DB
-- migration was missing, causing PostgreSQL 42703 "column does not exist"
-- on every notifications query.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread',
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Backfill: rows previously flagged is_read=true become status='read'.
-- read_at stays NULL for legacy rows — the original read timestamp is
-- not recoverable, and inventing one would be dishonest. New writes
-- after this migration will set read_at = NOW() when marking read.
UPDATE public.notifications
   SET status = 'read'
 WHERE is_read = TRUE
   AND status <> 'read';

CREATE INDEX IF NOT EXISTS notifications_channel_status_idx
  ON public.notifications (user_id, channel, status, created_at DESC);
