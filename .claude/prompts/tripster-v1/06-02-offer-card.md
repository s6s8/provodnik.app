# Phase 6.2 — Thread: offer card renderer + accept/decline/counter-offer

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-2`
**Branch:** `feat/tripster-v1-p6-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`
**Supabase browser client:** `import { createSupabaseBrowserClient } from "@/lib/supabase/client";`

**Relevant types:**
```ts
export type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  system_event_type: string | null;
  system_event_payload: Record<string, unknown> | null;
  created_at: string;
};

export type GuideOfferRow = {
  id: string;
  request_id: string;
  guide_id: string;
  price_minor: number;
  currency: string;
  description: string | null;
  status: "pending" | "accepted" | "declined" | "counter_offered" | "expired";
  valid_until: string | null;
  created_at: string;
};
```

**shadcn/ui:** Card, Button, Badge, Input, Textarea, Separator

## SCOPE

**Create:**
1. `src/features/messaging/components/OfferCard.tsx` — offer card renderer (client)
2. `src/features/messaging/actions/offerActions.ts` — accept/decline/counter Server Actions

**Modify:**
3. `src/features/messaging/components/MessageBubble.tsx` (or wherever system_event_type renders) — add case for `offer_sent`

**DO NOT touch:** Thread shell, other system event types.

## TASK

### 1. offerActions.ts

```ts
"use server";

export async function acceptOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("guide_offers")
    .update({ status: "accepted" })
    .eq("id", offerId);
  return { success: true };
}

export async function declineOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("guide_offers")
    .update({ status: "declined" })
    .eq("id", offerId);
  return { success: true };
}

export async function counterOffer(offerId: string, newPriceMinor: number, description: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Mark original as counter_offered, create new offer
  await supabase.from("guide_offers")
    .update({ status: "counter_offered" })
    .eq("id", offerId);
  const { data: original } = await supabase.from("guide_offers").select("*").eq("id", offerId).single();
  if (!original) throw new Error("Offer not found");
  await supabase.from("guide_offers").insert({
    request_id: original.request_id,
    guide_id: original.guide_id,
    price_minor: newPriceMinor,
    currency: original.currency,
    description: description || null,
    status: "pending",
  });
  return { success: true };
}
```

### 2. OfferCard.tsx (client)

Props:
```ts
type OfferCardProps = {
  offerId: string;
  priceMinor: number;
  currency: string;
  description: string | null;
  status: GuideOfferRow["status"];
  validUntil: string | null;
  viewerRole: "traveler" | "guide";  // who is viewing this card
};
```

Display:
- Card with header "Предложение гида"
- Price: `Math.round(priceMinor / 100)` ₽ in large text
- Description (if set)
- Valid until (if set): "Действительно до: {date}"
- Status badge: pending → "Ожидает ответа", accepted → "Принято", declined → "Отклонено", counter_offered → "Оспорено", expired → "Истёк срок"

If `status === "pending"` AND `viewerRole === "traveler"`:
- "Принять" button → calls `acceptOffer(offerId)` → refreshes
- "Отклонить" button → calls `declineOffer(offerId)` → refreshes
- Collapsible "Встречное предложение" section with price Input + description Textarea + "Отправить" button → calls `counterOffer()`

If already actioned: show status badge only, no buttons.

### 3. MessageBubble.tsx

Find the system event renderer. Add case:
```tsx
case "offer_sent": {
  const payload = message.system_event_payload as { offer_id: string; price_minor: number; currency: string; description: string | null; status: string; valid_until: string | null };
  return <OfferCard
    offerId={payload.offer_id}
    priceMinor={payload.price_minor}
    currency={payload.currency}
    description={payload.description}
    status={payload.status as GuideOfferRow["status"]}
    validUntil={payload.valid_until}
    viewerRole={/* derive from currentUserId vs message.sender_id */ "traveler"}
  />;
}
```

## INVESTIGATION RULE

Read before writing:
- `src/features/messaging/components/` — find MessageBubble or system event renderer
- `src/lib/supabase/types.ts` — GuideOfferRow fields

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p6-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- OfferCard renders price, description, status badge
- Traveler sees accept/decline/counter buttons when offer is pending
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(messaging): offer card renderer — accept/decline/counter-offer actions`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
