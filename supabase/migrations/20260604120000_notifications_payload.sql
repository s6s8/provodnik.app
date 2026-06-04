-- Add payload JSONB to notifications for rich context (actor, destination, date, participants)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS payload jsonb;
