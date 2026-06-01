-- Idempotency ledger for transactional email (offer/booking notifications).
-- PK (kind, entity_id) makes re-sends a no-op via ON CONFLICT / 23505.
-- Service-role (admin client) writes only; RLS enabled with no policy blocks
-- all anon/authed access.
create table if not exists public.notification_email_log (
  kind text not null,
  entity_id text not null,
  recipient text not null,
  sent_at timestamptz not null default now(),
  primary key (kind, entity_id)
);
alter table public.notification_email_log enable row level security;
