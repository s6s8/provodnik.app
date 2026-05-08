# Phase 10.2 — Notifications: preference page + pg_cron delivery worker

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p10-2`
**Branch:** `feat/tripster-v1-p10-2`

Tech stack: PostgreSQL (Supabase) + Next.js 15, TypeScript, Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_NOTIFICATIONS`

**This wave creates:**
1. A Supabase migration file for the pg_cron delivery worker
2. A preference page route (delegates actual 3D matrix UI to Phase 8.1's NotificationPrefsMatrix if that exists, or creates a standalone page)

**Relevant types:**
```ts
export type NotificationRow = {
  id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  channel: "in_app" | "email" | "telegram";
  status: "pending" | "sent" | "failed" | "read";
  created_at: string;
  read_at: string | null;
};
```

## SCOPE

**Create:**
1. `supabase/migrations/20260414000002_notification_delivery_worker.sql` — pg_cron delivery worker
2. `src/app/(protected)/profile/personal/notifications/page.tsx` — notification preferences standalone page

**DO NOT touch:** Bell popover (Phase 10.1), personal settings page.

## TASK

### 1. Migration: notification_delivery_worker.sql

```sql
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
```

### 2. Notification preferences page

```tsx
// src/app/(protected)/profile/personal/notifications/page.tsx
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_NOTIFICATIONS) notFound();
```

If `NotificationPrefsMatrix` exists (from Phase 8.1 at `src/features/profile/components/NotificationPrefsMatrix.tsx`):
- Import and render it directly with the guide's current prefs
- Save via `updatePersonalSettings()` Server Action

If it doesn't exist:
- Create a simple page showing "Настройки уведомлений" with a message that they can be configured in the personal settings page

The page should always link to `/profile/personal` as fallback.

## INVESTIGATION RULE

Before writing:
- `supabase/migrations/` — last migration filename for ordering
- `src/features/profile/components/NotificationPrefsMatrix.tsx` — check if it exists
- `src/features/profile/actions/updatePersonalSettings.ts` — check if it exists

## TDD CONTRACT

Migration must be valid SQL. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p10-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Migration creates `fn_deliver_pending_notifications` + pg_cron schedule
- Migration creates `fn_notify_user` helper
- Notification preferences page renders (uses Phase 8.1 matrix if available)
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(notifications): delivery worker pg_cron migration + preferences page`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
