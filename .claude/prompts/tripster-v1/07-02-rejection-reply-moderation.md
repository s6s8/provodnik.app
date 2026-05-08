# Phase 7.2 — Moderation: rejection cards + reply moderation

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p7-2`
**Branch:** `feat/tripster-v1-p7-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  title: string;
  status: "draft"|"pending_review"|"active"|"rejected"|"archived";
  rejection_reason: string | null;  // may not exist yet — check types.ts
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

**shadcn/ui:** Alert, Badge, Button, Card, Textarea, Separator

## SCOPE

**Create:**
1. `src/features/guide/components/listings/RejectionCard.tsx` — shows rejection reason on listings list
2. `src/features/reviews/components/ReplyComposer.tsx` — guide reply composer (submit for review flow)
3. `src/features/reviews/actions/submitReply.ts` — Server Action

**Modify:**
4. `src/app/(protected)/guide/listings/page.tsx` (guide listings list) — show RejectionCard for rejected listings

**DO NOT touch:** Admin moderation queue (Phase 7.1), review list display.

## TASK

### 1. RejectionCard.tsx

Props: `{ listing: Pick<ListingRow, "id" | "title" | "status" | "rejection_reason"> }`

Only renders when `listing.status === "rejected"`.

```tsx
<Alert variant="destructive">
  <AlertTitle>Объявление отклонено</AlertTitle>
  <AlertDescription>
    {listing.rejection_reason ?? "Причина не указана"}
  </AlertDescription>
  <Button asChild size="sm" className="mt-2" variant="outline">
    <a href={`/guide/listings/${listing.id}/edit`}>Редактировать и переотправить</a>
  </Button>
</Alert>
```

### 2. submitReply.ts

```ts
"use server";

export async function submitReplyForReview(replyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("review_replies")
    .update({ status: "pending_review", submitted_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("guide_id", user.id);
  return { success: true };
}

export async function saveReplyDraft(reviewId: string, body: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Upsert draft reply
  const { data: existing } = await supabase.from("review_replies")
    .select("id")
    .eq("review_id", reviewId)
    .eq("guide_id", user.id)
    .single();
  if (existing) {
    await supabase.from("review_replies")
      .update({ body, status: "draft" })
      .eq("id", existing.id);
    return { id: existing.id };
  }
  const { data } = await supabase.from("review_replies")
    .insert({ review_id: reviewId, guide_id: user.id, body, status: "draft" })
    .select("id").single();
  return { id: data!.id };
}
```

### 3. ReplyComposer.tsx (client)

Props: `{ reviewId: string; existingReply: ReviewReplyRow | null; }`

States:
- No reply: Textarea + "Сохранить черновик" + "Отправить на проверку" buttons
- Draft: shows draft body, edit Textarea, same two buttons
- pending_review: "Ответ на проверке у модератора" (read-only)
- published: shows published body (read-only)

Flow:
1. Type in Textarea → "Сохранить черновик" → `saveReplyDraft()` → shows saved confirmation
2. "Отправить на проверку" → `submitReplyForReview()` → shows "на проверке" state

### 4. Guide listings page

Find the listings list page at `src/app/(protected)/guide/listings/page.tsx`. After each listing row/card, render:
```tsx
{listing.status === "rejected" && <RejectionCard listing={listing} />}
```

## INVESTIGATION RULE

Read before writing:
- `src/app/(protected)/guide/listings/page.tsx` — listing card structure
- `src/lib/supabase/types.ts` — ReviewReplyRow fields, ListingRow.rejection_reason

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p7-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- RejectionCard shows on listings list for rejected listings
- ReplyComposer handles draft → pending_review → published states
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(moderation): rejection cards on guide listings + reply moderation composer`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
