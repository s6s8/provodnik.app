# Phase 5.6 — Traveler surfaces: booking form + inquiry tabs

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-6`
**Branch:** `feat/tripster-v1-p5-6`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Supabase (@supabase/ssr), Bun.

**Prerequisite (5.3 merged):** `/listings/[id]/page.tsx` exists. Booking sidebar links to `/listings/{id}/book`.

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**Auth (server component):**
```ts
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth?next=/listings/" + id + "/book");
```

**Relevant types:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  title: string;
  price_from_minor: number;
  currency: string;
  max_group_size: number;
  format: "group" | "private" | "combo" | null;
  instant_booking: boolean;
  booking_cutoff_hours: number;
};

export type TravelerRequestRow = {
  id: string;
  traveler_id: string;
  destination: string;
  region: string | null;
  category: string;
  starts_on: string;      // "YYYY-MM-DD"
  ends_on: string | null;
  budget_minor: number | null;
  currency: string;
  participants_count: number;
  format_preference: string | null;
  notes: string | null;
  open_to_join: boolean;
  allow_guide_suggestions: boolean;
  group_capacity: number | null;
  status: "open" | "booked" | "cancelled" | "expired";
  created_at: string;
  updated_at: string;
};
```

**shadcn/ui:** Button, Input, Textarea, Label, Tabs, TabsContent, TabsList, TabsTrigger, Select, Badge, Card, Alert

## SCOPE

**Create:**
1. `src/app/(protected)/listings/[id]/book/page.tsx` — booking page server component
2. `src/features/booking/components/BookingFormTabs.tsx` — tabs: "Заказать" + "Задать вопрос" (client)
3. `src/features/booking/actions/submitRequest.ts` — Server Action to insert TravelerRequest

**DO NOT touch:** Any guide-facing components, editor, listing detail page.

## KNOWLEDGE

### Business rules (v1)

- No payments in v1. "Заказать" creates a `traveler_request` (bid-first model).
- Guide receives the request, sends an offer. No direct booking.
- "Задать вопрос" creates a `traveler_request` with `notes` containing the question and `allow_guide_suggestions=false` flag is irrelevant — we use the `notes` field.
- After submission → redirect to `/requests/{request.id}` (the request thread page)

### Tab: "Заказать" (Order)

Form fields:
- `starts_on` — date input, required, must be ≥ today
- `ends_on` — date input, optional (for multi-day)
- `participants_count` — number input, min=1, max=listing.max_group_size
- `format_preference` — Select: "Любой формат", "Групповой", "Индивидуальный"
- `notes` — Textarea optional ("Пожелания, вопросы, особые потребности")
- Submit button: "Отправить заявку"

Zod schema:
```ts
const OrderSchema = z.object({
  starts_on: z.string().min(1, "Укажите дату"),
  ends_on: z.string().optional(),
  participants_count: z.number().min(1).max(999),
  format_preference: z.enum(["group","private","combo","any"]).optional(),
  notes: z.string().max(2000).optional(),
});
```

### Tab: "Задать вопрос" (Inquiry)

Simplified form:
- `notes` — Textarea required, min 10 chars, label "Ваш вопрос"
- Submit button: "Отправить вопрос"

Zod schema:
```ts
const QuestionSchema = z.object({
  notes: z.string().min(10, "Минимум 10 символов").max(2000),
});
```

### Server Action

```ts
"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitRequest(formData: {
  listingId: string;
  guideId: string;
  destination: string;
  region: string;
  category: string;
  startsOn: string;
  endsOn?: string;
  participantsCount: number;
  formatPreference?: string;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: request, error } = await supabase
    .from("traveler_requests")
    .insert({
      traveler_id: user.id,
      destination: formData.destination,
      region: formData.region,
      category: formData.category,
      starts_on: formData.startsOn,
      ends_on: formData.endsOn ?? null,
      participants_count: formData.participantsCount,
      format_preference: formData.formatPreference ?? null,
      notes: formData.notes ?? null,
      open_to_join: false,
      allow_guide_suggestions: true,
      budget_minor: null,
      currency: "RUB",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !request) throw new Error(error?.message ?? "Failed to create request");
  
  redirect(`/requests/${request.id}`);
}
```

### BookingFormTabs.tsx

Client component. Props:
```ts
interface Props {
  listing: Pick<ListingRow, "id" | "guide_id" | "title" | "region" | "price_from_minor" | "currency" | "max_group_size" | "format" | "category">;
  initialTab?: "order" | "question";
}
```

Uses `react-hook-form` + `zod` for both tabs. Calls `submitRequest` server action on submit.

Tab "Задать вопрос" sets `notes` = question text; rest of fields use listing defaults:
- starts_on = today's date
- participants_count = 1

## TASK

### 1. page.tsx (server)

Fetch listing, check auth (redirect to /auth if not logged in). Render BookingFormTabs.

```tsx
export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/listings/${id}/book`);
  
  const { data: listing } = await supabase
    .from("listings")
    .select("id, guide_id, title, region, price_from_minor, currency, max_group_size, format, category, status")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  
  if (!listing) notFound();
  
  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <h1 className="text-2xl font-semibold mb-2">{listing.title}</h1>
      <p className="text-muted-foreground mb-6">от {listing.price_from_minor / 100} ₽</p>
      <BookingFormTabs listing={listing} />
    </div>
  );
}
```

### 2. BookingFormTabs.tsx (client component)

Use shadcn Tabs with two tabs: "Заказать" and "Задать вопрос".

Read `?tab=question` from `useSearchParams()` to set initial tab.

On submit:
1. `useTransition` for loading state
2. Call `submitRequest(...)` inside `startTransition`
3. Show error Alert if action throws

### 3. submitRequest.ts (Server Action)

Implement as described in KNOWLEDGE section above.

## INVESTIGATION RULE

Before writing, read:
- `src/lib/supabase/server.ts` — exact export
- `src/lib/supabase/types.ts` — TravelerRequestRow exact column names
- `src/app/(protected)/` — protected layout structure (auth guard)

Never assume. If a column name doesn't match, check the types file.

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-6`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 3 files created
- `/listings/{id}/book` renders with 2-tab form
- Auth redirect works for unauthenticated users
- Server action inserts to `traveler_requests` and redirects to `/requests/{id}`
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(booking): booking form tabs — order + inquiry (bid-first v1)`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
