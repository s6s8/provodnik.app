# Phase 6.1 — Thread system events + inline renderers

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-1`
**Branch:** `feat/tripster-v1-p6-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite:** Messaging/thread infrastructure exists. Messages table has `sender_role = "system"` for system events.

**Existing thread page location:** look for it in `src/app/(protected)/` — likely at `messages/[threadId]/` or `requests/[id]/`.

**Relevant types:**
```ts
export type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_role: "traveler" | "guide" | "admin" | "system";
  body: string;
  metadata: unknown; // system_event_payload jsonb
  created_at: string;
};
```

**System event types (stored in metadata):**
```ts
type SystemEventType =
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined"
  | "booking_confirmed"
  | "moderation_rejected"
  | "review_request"
  | "dispute_opened"
  | "dispute_resolved";

interface SystemEventPayload {
  event_type: SystemEventType;
  actor_role?: "guide" | "traveler" | "admin";
  listing_title?: string;
  amount_minor?: number;
  currency?: string;
  reason?: string;  // for moderation_rejected, dispute_resolved
}
```

**shadcn/ui:** Badge, Card, Alert, Button, Separator

## SCOPE

**Create:**
1. `src/features/messaging/components/SystemEventMessage.tsx` — inline renderer for system events
2. `src/features/messaging/components/MessageBubble.tsx` — wraps all message types (user + system)

**Modify:**
3. The existing thread/conversation page (find it by reading the codebase) — use MessageBubble for rendering messages

**DO NOT touch:** Any listing, booking, or review components.

## TASK

### 1. SystemEventMessage.tsx

Props:
```ts
interface Props {
  eventType: SystemEventType;
  payload: SystemEventPayload;
  createdAt: string;
}
```

Render a centered divider-style event:

For each event type, render a specific message:

```ts
const EVENT_LABELS: Record<SystemEventType, (p: SystemEventPayload) => string> = {
  offer_sent:          (p) => `Гид отправил предложение${p.listing_title ? ` — «${p.listing_title}»` : ""}${p.amount_minor ? ` за ${p.amount_minor / 100} ${p.currency ?? "₽"}` : ""}`,
  offer_accepted:      (_) => "Путешественник принял предложение",
  offer_declined:      (_) => "Путешественник отклонил предложение",
  booking_confirmed:   (_) => "Бронирование подтверждено",
  moderation_rejected: (p) => `Объявление отклонено модератором${p.reason ? `: ${p.reason}` : ""}`,
  review_request:      (_) => "Пора оставить отзыв о поездке",
  dispute_opened:      (_) => "Открыт спор",
  dispute_resolved:    (p) => `Спор закрыт${p.reason ? `: ${p.reason}` : ""}`,
};
```

Layout: `<div className="flex items-center gap-3 py-2"><Separator className="flex-1"/><span className="text-xs text-muted-foreground px-2 shrink-0">{label}</span><Separator className="flex-1"/></div>`

Add a small timestamp below: `format(new Date(createdAt), "d MMM HH:mm", { locale: ru })` — use `date-fns` (likely already installed) with Russian locale.

### 2. MessageBubble.tsx

Props:
```ts
interface Props {
  message: MessageRow;
  currentUserId: string;
}
```

If `message.sender_role === "system"`:
- Parse `metadata` as `SystemEventPayload`
- Render `<SystemEventMessage eventType={payload.event_type} payload={payload} createdAt={message.created_at} />`

If `message.sender_role !== "system"`:
- Bubble alignment: `currentUserId === message.sender_id` → right (bg-primary text-primary-foreground), else left (bg-surface-high)
- Show message body text
- Show timestamp in corner

### 3. Wire into thread page

Find the existing thread/conversation page. Replace or wrap individual message renders with `<MessageBubble message={msg} currentUserId={currentUserId} />`.

## INVESTIGATION RULE

Before writing, read:
- `src/lib/supabase/types.ts` — MessageRow exact fields
- `src/app/(protected)/` directory — find the messaging/thread page
- The existing message rendering in that page

If `date-fns` is not installed, use `new Date(createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })` instead.

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `SystemEventMessage.tsx` + `MessageBubble.tsx` created
- Thread page uses `MessageBubble` for all messages
- System events render as centered dividers with human-readable labels
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(threads): system event inline renderers + message bubble`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
