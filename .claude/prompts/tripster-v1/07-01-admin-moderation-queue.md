# Phase 7.1 — Admin moderation queue

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p7-1`
**Branch:** `feat/tripster-v1-p7-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Access:** Admin-only route. Find existing admin route group (`src/app/(admin)/` or similar).

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Relevant types:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  slug: string;
  title: string;
  region: string;
  exp_type: string | null;
  description: string | null;
  status: "draft" | "pending_review" | "active" | "rejected" | "archived";
  created_at: string;
  updated_at: string;
};
```

**shadcn/ui:** Button, Badge, Card, Select, Textarea, Alert, Separator, Table (if available), Skeleton

## SCOPE

**Create:**
1. `src/app/(admin)/moderation/page.tsx` — moderation queue listing (server component)
2. `src/features/admin/components/ModerationQueueItem.tsx` — single item with approve/reject actions
3. `src/features/admin/actions/moderateListing.ts` — Server Actions for approve/reject

**DO NOT touch:** Guide-facing listing editor, traveler surfaces.

## TASK

### 1. moderateListing.ts (Server Actions)

```ts
"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function approveListing(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Verify admin role via jwt
  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  if (role !== "admin") throw new Error("Forbidden");
  
  await supabase.from("listings").update({ status: "active" }).eq("id", listingId).eq("status", "pending_review");
  return { success: true };
}

export async function rejectListing(listingId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  if (role !== "admin") throw new Error("Forbidden");

  await supabase.from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId)
    .eq("status", "pending_review");
  return { success: true };
}
```

### 2. ModerationQueueItem.tsx (client component)

Props:
```ts
interface Props {
  listing: Pick<ListingRow, "id" | "title" | "region" | "exp_type" | "guide_id" | "created_at" | "description">;
  onAction: () => void;
}
```

Shows:
- Listing title + region + exp_type badge
- Description preview (3-line clamp, masked with `maskPii` from `@/lib/pii/mask`)
- "Посмотреть объявление" link → `/admin/listings/{id}` or `/listings/{id}`
- "Одобрить" Button (green) → calls `approveListing(listing.id)` then `onAction()`
- "Отклонить" Button (destructive) → opens inline Textarea for rejection reason + confirm
  - Canned reasons (click to fill textarea):
    - "Неполное описание"
    - "Некорректные фотографии"
    - "Подозрение на мошенничество"
    - "Нарушение правил платформы"
  - "Подтвердить отклонение" Button → calls `rejectListing(listing.id, reason)` then `onAction()`

### 3. page.tsx (server component)

```tsx
export default async function ModerationQueuePage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, region, exp_type, guide_id, description, created_at, status")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })
    .limit(50);
  
  // Also fetch pending review replies
  const { data: replies } = await supabase
    .from("review_replies")
    .select("id, review_id, body, submitted_at")
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true })
    .limit(20);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Очередь модерации</h1>
      
      {/* Listings section */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">
          Объявления ({listings?.length ?? 0})
        </h2>
        {listings?.length === 0 && (
          <p className="text-muted-foreground">Нет объявлений на проверке</p>
        )}
        <div className="space-y-4">
          {listings?.map(listing => (
            <ModerationQueueItem key={listing.id} listing={listing} onAction={() => {/* page refresh via router.refresh() */}} />
          ))}
        </div>
      </section>

      {/* Reply replies section - simple list for now */}
      {replies && replies.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Ответы на отзывы ({replies.length})</h2>
          {/* Simple table: review_id | body preview | approve/reject */}
          <div className="space-y-2">
            {replies.map(reply => (
              <div key={reply.id} className="flex items-start gap-4 rounded-card border border-border p-4">
                <p className="flex-1 text-sm line-clamp-2">{reply.body}</p>
                {/* Actions will be added in wave 7.2 */}
                <Badge variant="secondary">На проверке</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

Note: `onAction` in `ModerationQueueItem` should call `router.refresh()` to reload server data. Import `useRouter` in the client component and call `router.refresh()` after successful action.

## INVESTIGATION RULE

Read before writing:
- `src/app/(admin)/` — existing admin route structure and auth guard
- `src/lib/pii/mask.ts` — maskPii import
- `src/lib/supabase/types.ts` — ListingRow, ReviewReplyRow

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p7-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 3 files created
- `/admin/moderation` shows pending_review listings + replies
- Approve/reject works with Server Actions
- PII masked in description previews
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(moderation): admin queue — approve/reject listings + canned rejection reasons`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
