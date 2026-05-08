# Phase 9.5 — Guide dashboard: listings management

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-5`
**Branch:** `feat/tripster-v1-p9-5`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  title: string;
  region: string;
  exp_type: string | null;
  status: "draft"|"pending_review"|"active"|"rejected"|"archived";
  average_rating: number;
  review_count: number;
  image_url: string | null;
  price_from_minor: number;
  currency: string;
  created_at: string;
};
```

**shadcn/ui:** Badge, Button, Card, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## SCOPE

**Create:**
1. `src/app/(protected)/guide/listings-v1/page.tsx` — listings management page (server, NOT replacing existing)
2. `src/features/guide/components/listings-management/ListingsTable.tsx` — table with status filter + bulk actions (client)
3. `src/features/guide/components/listings-management/listingManagementActions.ts` — Server Actions for bulk publish/unpublish/archive

**DO NOT touch:** Existing `src/app/(protected)/guide/listings/` pages.

## TASK

### 1. listingManagementActions.ts

```ts
"use server";

export async function bulkSetStatus(listingIds: string[], status: "active" | "archived") {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("listings")
    .update({ status })
    .in("id", listingIds)
    .eq("guide_id", user.id);  // RLS guard
  return { success: true };
}

export async function quickEditTitle(listingId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("listings")
    .update({ title: title.trim() })
    .eq("id", listingId)
    .eq("guide_id", user.id);
  return { success: true };
}
```

### 2. ListingsTable.tsx (client)

Props: `{ listings: ListingRow[]; }`

Features:
- Status filter tabs: "Все" | "Активные" | "На проверке" | "Черновики" | "Отклонённые" | "В архиве"
  - Each tab shows count badge
- Table columns: [checkbox] | Название | Тип | Регион | Статус | Рейтинг | Действия
- Row actions: Edit (→ `/guide/listings/{id}/edit`) | Archive button | Publish button (only for draft/archived)
- Quick-edit title: click on title to open inline Input, save on blur/enter → `quickEditTitle()`
- Bulk actions bar (shown when checkboxes selected): "Опубликовать ({n})" | "В архив ({n})"
  - → `bulkSetStatus(selectedIds, "active"|"archived")`
- Show `<img>` thumbnail (24×24) or placeholder if no image

### 3. page.tsx (server)

```ts
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: listings } = await supabase
  .from("listings")
  .select("id, guide_id, title, region, exp_type, status, average_rating, review_count, image_url, price_from_minor, currency, created_at")
  .eq("guide_id", user!.id)
  .order("created_at", { ascending: false });
```

Render `<ListingsTable listings={listings ?? []} />`.

Header: h1 "Управление объявлениями" + "Создать объявление" Button → `/guide/listings/new`

## INVESTIGATION RULE

Read before writing:
- `src/app/(protected)/guide/listings/` — existing listings pages (do not duplicate)
- `src/lib/supabase/types.ts` — ListingRow status values

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-5`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Listings table shows all guide's listings with status filter tabs
- Bulk publish/archive works
- Quick-edit title works
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(dashboard): listings management — status filter, bulk actions, quick-edit title`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
