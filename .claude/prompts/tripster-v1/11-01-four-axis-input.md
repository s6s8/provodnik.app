# Phase 11.1 — Reputation: 4-axis review submission

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-1`
**Branch:** `feat/tripster-v1-p11-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Supabase (@supabase/ssr), Bun.

**ADR-032:** 4-axis review ratings in `review_ratings_breakdown`; `reviews.rating` is denormalized overall for list queries.
**ADR-033:** Review replies are moderated: `draft → pending_review → published`.

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**Relevant types:**
```ts
export type ReviewRatingsBreakdownRow = {
  review_id: string;
  axis: "material" | "engagement" | "knowledge" | "route";
  score: number;  // 1-5
};

// Existing reviews table (from main schema):
// id, booking_id, reviewer_id, guide_id, listing_id,
// rating (overall 1-5), body, status, created_at
```

**shadcn/ui:** Button, Textarea, Label, Badge, Card, Alert

## SCOPE

**Create:**
1. `src/features/reviews/components/StarRatingInput.tsx` — interactive 1-5 star selector (client component)
2. `src/features/reviews/components/FourAxisReviewForm.tsx` — 4-axis + overall rating form (client)
3. `src/features/reviews/actions/submitReview.ts` — Server Action

**Modify:**
4. Booking completion page or post-booking page (find it) — add a "Оставить отзыв" section

**DO NOT touch:** Listings, editor, notifications.

## TASK

### 1. StarRatingInput.tsx (client component)

Props:
```ts
interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}
```

Render 5 clickable star icons (Lucide `Star`). Filled stars = yellow (`text-yellow-400 fill-yellow-400`). Empty = muted. Hover state shows preview. Required: value must be 1–5.

### 2. FourAxisReviewForm.tsx (client component)

Props:
```ts
interface Props {
  bookingId: string;
  guideId: string;
  listingId: string;
  listingTitle: string;
}
```

Form fields with react-hook-form + Zod:
```ts
const ReviewSchema = z.object({
  overall: z.number().min(1).max(5),
  material: z.number().min(1).max(5),      // Материал
  engagement: z.number().min(1).max(5),    // Заинтересованность
  knowledge: z.number().min(1).max(5),     // Знания гида
  route: z.number().min(1).max(5),         // Маршрут
  body: z.string().min(20, "Минимум 20 символов").max(3000),
});
```

UI:
- Section header: "Оцените поездку: «{listingTitle}»"
- Overall rating: `<StarRatingInput>` label="Общая оценка"
- 4 axis ratings in 2×2 grid:
  - Материал (presentation quality)
  - Заинтересованность (did the guide engage you)
  - Знания (guide's knowledge)
  - Маршрут (route/itinerary quality)
- `body` Textarea (label "Напишите отзыв", rows=5)
- Submit Button: "Опубликовать отзыв"
- On submit: call `submitReview` server action
- Show success Alert after submission

### 3. submitReview.ts (Server Action)

```ts
"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitReview(data: {
  bookingId: string;
  guideId: string;
  listingId: string;
  overall: number;
  material: number;
  engagement: number;
  knowledge: number;
  route: number;
  body: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Insert main review
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: data.bookingId,
      reviewer_id: user.id,
      guide_id: data.guideId,
      listing_id: data.listingId,
      rating: data.overall,
      body: data.body,
      status: "published",  // direct publish; moderation is for replies only
    })
    .select("id")
    .single();

  if (error || !review) throw new Error(error?.message ?? "Failed to submit review");

  // Insert 4-axis breakdown
  const axes: Array<[string, number]> = [
    ["material", data.material],
    ["engagement", data.engagement],
    ["knowledge", data.knowledge],
    ["route", data.route],
  ];

  await supabase.from("review_ratings_breakdown").insert(
    axes.map(([axis, score]) => ({
      review_id: review.id,
      axis,
      score,
    }))
  );

  return { reviewId: review.id };
}
```

### 4. Add to booking completion

Find the booking completion/confirmation page. After booking is "completed", show:
```tsx
{booking.status === "completed" && !hasReview && (
  <FourAxisReviewForm
    bookingId={booking.id}
    guideId={booking.guide_id}
    listingId={booking.listing_id}
    listingTitle={listing?.title ?? "Поездка"}
  />
)}
```

Read the booking page to understand exact structure before modifying.

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — confirm reviews table columns (BookingRow, ReviewRatingsBreakdownRow)
- `src/app/(protected)/` — find booking detail/completion page
- `src/lib/supabase/server.ts` — confirm export

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `StarRatingInput.tsx`, `FourAxisReviewForm.tsx`, `submitReview.ts` created
- Review form shown after completed bookings
- Server action inserts review + 4-axis breakdown
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(reputation): 4-axis review submission — star inputs + breakdown storage`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
