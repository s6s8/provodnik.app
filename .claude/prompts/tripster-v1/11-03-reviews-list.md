# Phase 11.3 — Reputation: reviews list + 4-axis breakdown + reply composer

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-3`
**Branch:** `feat/tripster-v1-p11-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_REPUTATION`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type ReviewRow = {
  id: string;
  listing_id: string;
  guide_id: string;
  traveler_id: string;
  rating: number;  // 1-5 overall
  body: string | null;
  status: "draft"|"submitted"|"published";
  created_at: string;
};

export type ReviewRatingBreakdownRow = {
  review_id: string;
  axis: "material"|"engagement"|"knowledge"|"route";
  score: number;  // 1-5
};

export type ReviewReplyRow = {
  id: string;
  review_id: string;
  guide_id: string;
  body: string;
  status: "draft"|"pending_review"|"published";
  submitted_at: string | null;
  published_at: string | null;
};
```

**shadcn/ui:** Badge, Button, Card, Separator, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, Textarea

**Axis labels (Russian):**
```ts
const AXIS_LABELS: Record<string, string> = {
  material: "Материал",
  engagement: "Вовлечённость",
  knowledge: "Знания гида",
  route: "Маршрут",
};
```

## SCOPE

**Create:**
1. `src/features/reviews/components/ReviewCard.tsx` — single review display with 4-axis breakdown
2. `src/features/reviews/components/ReviewsList.tsx` — list with 3-bucket star filter (client)
3. `src/app/(protected)/guide/reviews/page.tsx` — guide's reviews management page (server)

**Reuse from Phase 7.2** (if exists):
- `src/features/reviews/components/ReplyComposer.tsx`
- `src/features/reviews/actions/submitReply.ts`

If Phase 7.2 files don't exist, create them inline.

**DO NOT touch:** Listing detail review section (Phase 5.3), 4-axis input (Phase 11.1).

## TASK

### 1. ReviewCard.tsx

Props:
```ts
type ReviewCardProps = {
  review: ReviewRow;
  breakdown: ReviewRatingBreakdownRow[];
  reply: ReviewReplyRow | null;
  showReplyComposer?: boolean;  // true on guide's management page
};
```

Display:
- Star rating (overall `review.rating`)
- Review body (masked with `maskPii` from `@/lib/pii/mask`)
- Date: `new Date(review.created_at).toLocaleDateString("ru-RU")`
- 4-axis breakdown as mini grid:
  ```
  Материал: ★★★★☆
  Вовлечённость: ★★★★★
  Знания гида: ★★★★☆
  Маршрут: ★★★☆☆
  ```
- If reply published: show reply with "Ответ гида:" label
- If `showReplyComposer=true`: render `<ReplyComposer reviewId={review.id} existingReply={reply} />`

Star rendering helper:
```ts
function Stars({ n }: { n: number }) {
  return <span>{Array.from({ length: 5 }, (_, i) => i < n ? "★" : "☆").join("")}</span>;
}
```

### 2. ReviewsList.tsx (client)

Props:
```ts
type ReviewsListProps = {
  reviews: (ReviewRow & { breakdown: ReviewRatingBreakdownRow[]; reply: ReviewReplyRow | null })[];
  showReplyComposer?: boolean;
};
```

3-bucket filter buttons:
- "Все" | "Положительные (4–5 ★)" | "Критические (1–3 ★)"

Filter by clicking updates local state. Show filtered reviews.

Count badge per bucket in button label.

### 3. guide/reviews/page.tsx (server)

```ts
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_REPUTATION) notFound();

const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
const guideId = user!.id;

const { data: reviews } = await supabase
  .from("reviews")
  .select("*, review_ratings_breakdown(*), review_replies(*)")
  .eq("guide_id", guideId)
  .eq("status", "published")
  .order("created_at", { ascending: false });
```

Transform data, render `<ReviewsList reviews={...} showReplyComposer={true} />`.

## INVESTIGATION RULE

Read before writing:
- `src/features/reviews/` — check if ReplyComposer/submitReply from Phase 7.2 already exist
- `src/lib/pii/mask.ts` — maskPii import
- `src/lib/supabase/types.ts` — ReviewRow, ReviewRatingBreakdownRow

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p11-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Reviews list shows with 4-axis breakdown per review
- 3-bucket star filter works
- Reply composer attached to each review on guide reviews page
- FEATURE_TRIPSTER_REPUTATION=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(reputation): reviews list with 4-axis breakdown + 3-bucket filter + reply composer`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
