# Phase 9.3 — Guide dashboard: orders inbox

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-3`
**Branch:** `feat/tripster-v1-p9-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type TravelerRequestRow = {
  id: string;
  traveler_id: string;
  destination: string;
  region: string | null;
  category: string;
  starts_on: string;
  ends_on: string | null;
  budget_minor: number | null;
  currency: string;
  participants_count: number;
  format_preference: string | null;
  notes: string | null;
  status: "open" | "booked" | "cancelled" | "expired";
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  traveler_id: string;
  guide_id: string;
  request_id: string | null;
  offer_id: string | null;
  listing_id: string | null;
  status: "pending" | "awaiting_guide_confirmation" | "confirmed" | "cancelled" | "completed" | "disputed" | "no_show";
  party_size: number;
  starts_at: string | null;
  ends_at: string | null;
  subtotal_minor: number;
  currency: string;
  created_at: string;
  updated_at: string;
};
```

**shadcn/ui:** Tabs, TabsList, TabsTrigger, TabsContent, Badge, Card, Button, Skeleton, Separator

## SCOPE

**Create:**
1. `src/app/(protected)/guide/orders/page.tsx` — orders inbox server component
2. `src/features/guide/components/orders/RequestCard.tsx` — request row
3. `src/features/guide/components/orders/BookingCard.tsx` — booking row

**DO NOT touch:** Dashboard KPI, listings management, other features.

## TASK

### 1. page.tsx (server component)

Fetch guide's open requests and bookings:

```ts
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user!.id;

// Open requests (guide can offer on these)
// NOTE: requests are from travelers, guide_offers link guides to requests
const { data: guidesOffers } = await supabase
  .from("guide_offers")
  .select("request_id, status, id")
  .eq("guide_id", userId);

const offerRequestIds = guidesOffers?.map(o => o.request_id) ?? [];

// Bookings where guide is involved
const { data: bookings } = await supabase
  .from("bookings")
  .select("*")
  .eq("guide_id", userId)
  .order("created_at", { ascending: false })
  .limit(50);
```

Tabs:
- "Новые" — bookings with status "awaiting_guide_confirmation"
- "Активные" — bookings with status "confirmed"
- "Завершённые" — bookings with status "completed"
- "Архив" — bookings with status "cancelled" | "no_show" | "disputed"

Count badge per tab showing count.

### 2. RequestCard.tsx

Props: `{ request: TravelerRequestRow; }`

Show: destination, region, starts_on, participants_count, budget (if set), notes preview (2-line clamp, masked with maskPii).
Link: → `/guide/requests/{request.id}` (thread page)
Button: "Ответить" (same link)

### 3. BookingCard.tsx

Props: `{ booking: BookingRow; onConfirm?: (id: string) => void; }`

Show: booking date (starts_at), party_size, subtotal (÷100), status badge.
For "awaiting_guide_confirmation": show "Подтвердить" + "Отклонить" buttons.
Confirm action: Server Action `confirmBooking(bookingId)` → update status to "confirmed".
Link → `/guide/bookings/{booking.id}`

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — BookingRow, TravelerRequestRow, GuideOfferRow
- `src/app/(protected)/guide/` — existing guide page structure
- `src/lib/pii/mask.ts` — maskPii import

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 3 files created
- Orders page shows bookings in segmented tabs with counts
- Confirm/decline works for awaiting_guide_confirmation bookings
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(dashboard): orders inbox — booking tabs with confirm/decline actions`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
