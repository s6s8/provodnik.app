-- Enable pg_cron extension (available in all Supabase projects)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- One-time backfill: mark all open requests with past start date as expired
UPDATE public.traveler_requests
SET
  status = 'expired',
  updated_at = NOW()
WHERE
  starts_on < CURRENT_DATE
  AND status = 'open';

-- Unschedule existing job if present (makes migration idempotent on re-apply)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'expire-open-requests';

-- Schedule hourly expiry job
-- Runs at minute 0 of every hour
SELECT cron.schedule(
  'expire-open-requests',
  '0 * * * *',
  $$
    UPDATE public.traveler_requests
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE
      starts_on < CURRENT_DATE
      AND status = 'open';
  $$
);
