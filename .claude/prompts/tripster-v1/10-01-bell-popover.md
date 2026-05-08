# Phase 10.1 — Notifications: bell popover + nav badges

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p10-1`
**Branch:** `feat/tripster-v1-p10-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**ADR-031:** Notifications delivered via pg_cron worker reading `notifications` table; no external queue.

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**Relevant types:**
```ts
// Note: there are TWO notification types in types.ts:
// NotificationRow (old) and NotificationRow2 (tripster v1)
// Use NotificationRow2 for this feature

export type NotificationRow2 = {
  id: string;
  user_id: string;
  event_type: string;  // see EVENT_LABELS below
  payload: Record<string, unknown>;
  channel: string;     // "in_app" | "email" | "telegram"
  status: string;      // "pending" | "sent" | "read" | "failed"
  created_at: string;
  read_at: string | null;
};
```

**shadcn/ui:** Button, Badge, Popover, PopoverTrigger, PopoverContent, Separator, ScrollArea

**Flag:** Import `flags` from `@/lib/flags` — this component is behind `FEATURE_TRIPSTER_NOTIFICATIONS` sub-flag.

## SCOPE

**Create:**
1. `src/features/notifications/components/NotificationBell.tsx` — bell icon + popover (client component)
2. `src/features/notifications/components/NotificationItem.tsx` — single notification row

**Modify:**
3. The app header/navbar (find it — likely `src/components/layout/` or `src/app/(protected)/layout.tsx`) — add `<NotificationBell />` gated by `FEATURE_TRIPSTER_NOTIFICATIONS`

**DO NOT touch:** Other feature components, guide editor, or listing pages.

## TASK

### 1. NotificationItem.tsx

Props: `{ notification: NotificationRow2; onMarkRead: (id: string) => void; }`

Russian event type labels:
```ts
const EVENT_LABELS: Record<string, string> = {
  new_offer:            "Новое предложение от гида",
  offer_expiring:       "Предложение скоро истекает",
  booking_created:      "Создано бронирование",
  booking_confirmed:    "Бронирование подтверждено",
  booking_cancelled:    "Бронирование отменено",
  booking_completed:    "Поездка завершена",
  dispute_opened:       "Открыт спор",
  review_requested:     "Оставьте отзыв",
  admin_alert:          "Сообщение от администратора",
  listing_approved:     "Объявление одобрено",
  listing_rejected:     "Объявление отклонено",
};
```

Layout: icon + label + timestamp. Unread items have `bg-surface-high` background. Click → `onMarkRead(notification.id)`.

### 2. NotificationBell.tsx (client component)

- On mount: fetch `notifications` where `user_id = currentUserId` AND `channel = "in_app"` AND `status != "read"`, ordered by created_at desc, limit 20
- Use Supabase Realtime to subscribe to new notifications:
  ```ts
  supabase.channel("notifications").on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "notifications",
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    setNotifications(prev => [payload.new as NotificationRow2, ...prev]);
  }).subscribe();
  ```

Render:
- Bell icon (Lucide `Bell`) button
- If unread count > 0: red Badge overlay with count (max "9+")
- Popover opens on click showing:
  - Header: "Уведомления" + "Отметить все как прочитанные" Button
  - ScrollArea with `<NotificationItem>` list
  - Footer: Link to `/profile/notifications`
  - If empty: "Нет новых уведомлений"

Mark as read:
```ts
const markRead = async (id: string) => {
  await supabase.from("notifications").update({ status: "read", read_at: new Date().toISOString() }).eq("id", id);
  setNotifications(prev => prev.filter(n => n.id !== id));
};
```

Mark all read:
```ts
const markAllRead = async () => {
  await supabase.from("notifications").update({ status: "read", read_at: new Date().toISOString() }).eq("user_id", userId).neq("status", "read");
  setNotifications([]);
};
```

Gets `userId` from a prop or via `useEffect` to fetch `supabase.auth.getUser()`.

Props:
```ts
interface Props {
  userId: string;
}
```

### 3. Add to navbar

Find the main navigation header. Add:
```tsx
import { flags } from "@/lib/flags";
// ...
{flags.FEATURE_TRIPSTER_NOTIFICATIONS && <NotificationBell userId={userId} />}
```

The `userId` comes from the server layout's auth context. Read the layout file to understand how userId is currently passed to header components.

## INVESTIGATION RULE

Before writing, read:
- `src/app/(protected)/layout.tsx` (or wherever the main nav/header lives)
- `src/lib/supabase/types.ts` — find NotificationRow2 (may be named differently)
- `src/lib/supabase/client.ts` — confirm browser client export name
- `src/lib/flags.ts` — confirm FEATURE_TRIPSTER_NOTIFICATIONS flag name

## TDD CONTRACT

No unit tests. TypeScript compile must pass. Realtime subscription cleanup in useEffect return.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p10-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `NotificationBell.tsx` + `NotificationItem.tsx` created
- Bell appears in navbar behind FEATURE_TRIPSTER_NOTIFICATIONS flag
- Realtime subscription wired with cleanup
- Mark-as-read works
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(notifications): bell popover + realtime subscription + mark-as-read`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
