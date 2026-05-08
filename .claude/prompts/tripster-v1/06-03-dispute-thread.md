# Phase 6.3 — Thread: dispute UI

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-3`
**Branch:** `feat/tripster-v1-p6-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_DISPUTES`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type DisputeRow = {
  id: string;
  booking_id: string;
  opened_by: string;
  status: "open" | "under_review" | "resolved" | "escalated";
  resolution: string | null;
  opened_at: string;
  resolved_at: string | null;
};

export type DisputeEventRow = {
  id: string;
  dispute_id: string;
  actor_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};
```

**shadcn/ui:** Button, Badge, Card, Textarea, Separator, Alert

## SCOPE

**Create:**
1. `src/features/disputes/actions/openDispute.ts` — Server Action: traveler opens dispute from booking
2. `src/features/disputes/components/DisputeThread.tsx` — dispute thread viewer (server component)
3. `src/app/(protected)/disputes/[id]/page.tsx` — dispute detail page

**Modify:**
4. `src/app/(protected)/bookings/[id]/page.tsx` (if exists) — add "Открыть спор" button gated by `FEATURE_TRIPSTER_DISPUTES`

**DO NOT touch:** Main messaging thread, admin moderation queue.

## TASK

### 1. openDispute.ts

```ts
"use server";
import { flags } from "@/lib/flags";

export async function openDispute(bookingId: string, reason: string) {
  if (!flags.FEATURE_TRIPSTER_DISPUTES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data, error } = await supabase.from("disputes").insert({
    booking_id: bookingId,
    opened_by: user.id,
    status: "open",
  }).select("id").single();
  if (error) throw error;
  // Log opening event
  await supabase.from("dispute_events").insert({
    dispute_id: data.id,
    actor_id: user.id,
    event_type: "dispute_opened",
    payload: { reason },
  });
  return { success: true, disputeId: data.id };
}
```

### 2. DisputeThread.tsx (server component)

Props: `{ disputeId: string; adminView?: boolean; }`

Fetch dispute + events + booking info.

Display:
- Header: "Спор #{disputeId.slice(0,8)}" + status badge
- Status badge colors: open → yellow, under_review → blue, resolved → green, escalated → red
- Timeline of dispute_events (chronological)
- If `adminView`: show "Решить" dropdown with resolution textarea + "Закрыть спор" button → updates status to "resolved"
- If traveler view: read-only, show current status + "Спор рассматривается администрацией"

### 3. disputes/[id]/page.tsx

```tsx
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_DISPUTES) notFound();
```

Fetch dispute, check user is `opened_by` or admin. Render `<DisputeThread disputeId={params.id} />`.

### 4. Modify bookings/[id]/page.tsx

If the file exists, add after booking status:
```tsx
{flags.FEATURE_TRIPSTER_DISPUTES && booking.status !== "disputed" && (
  <OpenDisputeButton bookingId={booking.id} />
)}
```

Create `OpenDisputeButton` as a small client component inline:
- "Открыть спор" Button variant="destructive" size="sm"
- Opens a Dialog with Textarea for reason + confirm button → calls `openDispute()` → redirects to `/disputes/{id}`

## INVESTIGATION RULE

Read before writing:
- `src/app/(protected)/bookings/[id]/page.tsx` — if it exists, understand structure
- `src/lib/flags.ts` — FEATURE_TRIPSTER_DISPUTES name
- `src/lib/supabase/types.ts` — DisputeRow, DisputeEventRow

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Traveler can open a dispute from a booking
- Dispute thread shows events timeline + status
- FEATURE_TRIPSTER_DISPUTES=0 hides everything
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(disputes): dispute thread UI — open dispute, timeline, admin resolution`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
