# Phase 12.2 — Favorites + folders

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-2`
**Branch:** `feat/tripster-v1-p12-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_FAVORITES`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types:**
```ts
export type FavoritesFolderRow = {
  id: string;
  user_id: string;
  name: string;
  position: number;
};

export type FavoritesItemRow = {
  folder_id: string;
  listing_id: string;
  added_at: string;
};
```

**shadcn/ui:** Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Badge, Separator, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger

## SCOPE

**Create:**
1. `src/app/(protected)/favorites/page.tsx` — favorites page (server)
2. `src/features/favorites/components/FavoritesManager.tsx` — folder CRUD + listing grid (client)
3. `src/features/favorites/components/AddToFolderButton.tsx` — bookmark button for listing cards (client)
4. `src/features/favorites/actions/favoritesActions.ts` — Server Actions

**DO NOT touch:** Listing detail pages, existing listing cards.

## TASK

### 1. favoritesActions.ts

```ts
"use server";
import { flags } from "@/lib/flags";

export async function createFolder(name: string) {
  if (!flags.FEATURE_TRIPSTER_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: existing } = await supabase.from("favorites_folders")
    .select("position").eq("user_id", user.id).order("position", { ascending: false }).limit(1);
  const nextPosition = (existing?.[0]?.position ?? -1) + 1;
  await supabase.from("favorites_folders").insert({ user_id: user.id, name, position: nextPosition });
  return { success: true };
}

export async function deleteFolder(folderId: string) {
  if (!flags.FEATURE_TRIPSTER_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_folders").delete().eq("id", folderId).eq("user_id", user.id);
  return { success: true };
}

export async function addToFolder(folderId: string, listingId: string) {
  if (!flags.FEATURE_TRIPSTER_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_items").upsert({ folder_id: folderId, listing_id: listingId });
  return { success: true };
}

export async function removeFromFolder(folderId: string, listingId: string) {
  if (!flags.FEATURE_TRIPSTER_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_items").delete()
    .eq("folder_id", folderId).eq("listing_id", listingId);
  return { success: true };
}
```

### 2. FavoritesManager.tsx (client)

Props:
```ts
type FavoritesManagerProps = {
  folders: (FavoritesFolderRow & {
    items: (FavoritesItemRow & {
      listing: { id: string; title: string; image_url: string | null; price_from_minor: number; region: string }
    })[]
  })[];
};
```

Layout:
- Left column: folder list with "+" Create folder button
  - Click folder → shows that folder's listings on right
  - Delete folder button (ConfirmDialog)
- Right column: grid of listings in selected folder
  - Each card: thumbnail + title + price + "Удалить из папки" button

Create folder Dialog: Input for name + "Создать" button → `createFolder()`.

### 3. AddToFolderButton.tsx (client)

Props: `{ listingId: string; }`

Small bookmark icon button. On click:
- If not logged in → show "Войдите для сохранения" tooltip
- If logged in → show DropdownMenu with user's folders
  - Click folder → `addToFolder(folderId, listingId)`
  - "Создать папку" option at bottom → inline Input

### 4. page.tsx (server)

```ts
if (!flags.FEATURE_TRIPSTER_FAVORITES) notFound();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth");
const { data: folders } = await supabase
  .from("favorites_folders")
  .select("*, favorites_items(*, listing:listings(id, title, image_url, price_from_minor, region))")
  .eq("user_id", user.id)
  .order("position");
```

Render `<FavoritesManager folders={folders ?? []} />`.

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — FavoritesFolderRow, FavoritesItemRow
- `src/lib/flags.ts` — FEATURE_TRIPSTER_FAVORITES flag

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Favorites page shows folders + listings
- Create/delete folder works
- Add/remove from folder works
- FEATURE_TRIPSTER_FAVORITES=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(favorites): folder CRUD + add-to-folder picker + favorites page`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
