# Phase 4.11 — ListingEditorV1: tour programme grids (videos)

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-11`
**Branch:** `feat/tripster-v1-p4-11`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Prerequisite:** Wave 4.10 merged. `ItinerarySection`, `MealsGridSection`, `IncludedExcludedSection`, `DifficultySection`, `AccommodationSection` all exist.

**Note:** The spec calls this wave "Tour branch B — meals grid / transport / videos". MealsGridSection was implemented in 4.10. This wave adds the `VideosSection` only.

**Section contract:**
```ts
interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}
```

**Relevant types:**
```ts
export type ListingVideoRow = {
  id: string;
  listing_id: string;
  url: string;
  poster_url: string | null;
  position: number;
};
```

**Supabase browser client:**
```ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

**shadcn/ui:** Button, Input, Label, Card, Badge, Skeleton

## SCOPE

**Create:**
1. `src/features/guide/components/listings/ListingEditorV1/sections/VideosSection.tsx`

**Modify:**
2. `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — add VideosSection export
3. Add `videos` SectionKey to types.ts (if not already present) — but wait: `videos` is not in the original `SectionKey` union. The spec mentions videos as part of the tour, but the sidebar navigation uses named section keys. Implementing as a sub-section of `itinerary` is cleaner.

**Actually:** Since `videos` is not a top-level SectionKey in the original types.ts, implement the `VideosSection` as a component that gets rendered inside the `ItinerarySection` as a "Videos" sub-panel at the bottom of that section.

**Modify:**
3. `src/features/guide/components/listings/ListingEditorV1/sections/ItinerarySection.tsx` — add a "Видео тура" section at the bottom using `VideosSection`

**DO NOT touch:** types.ts SectionKey union (do not add `videos` key — it's not in the navigation).

## TASK

### 1. VideosSection.tsx (client component, used inside ItinerarySection)

This is NOT a top-level sidebar section. It's a sub-panel rendered within ItinerarySection.

Props:
```ts
interface Props {
  listingId: string;
}
```

- On mount: fetch `listing_videos` where `listing_id = listingId` order by `position asc`
- Display as list: video URL + optional poster URL + delete button
- "Добавить видео" form:
  - `url` Input required (YouTube/Vimeo URL)
  - `poster_url` Input optional (preview image URL)
  - On submit: `supabase.from("listing_videos").insert({ listing_id: listingId, url, poster_url: posterUrl || null, position: videos.length })`
- Delete: `supabase.from("listing_videos").delete().eq("id", video.id)`
- For each video URL, detect if it's a YouTube URL and extract the embed ID to show a small preview thumbnail: `https://img.youtube.com/vi/{youtubeId}/hqdefault.jpg`
- Use Skeleton while loading

### 2. Add to ItinerarySection

At the bottom of `ItinerarySection`, after the day list and before the closing return, add:
```tsx
<Separator className="my-6" />
<div>
  <h3 className="mb-3 text-base font-semibold">Видео тура</h3>
  <VideosSection listingId={listing.id} />
</div>
```

## INVESTIGATION RULE

Before writing, read:
- `src/features/guide/components/listings/ListingEditorV1/sections/ItinerarySection.tsx`
- `src/lib/supabase/types.ts` — ListingVideoRow
- `src/lib/supabase/client.ts` — browser client export

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-11`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `VideosSection.tsx` created
- `ItinerarySection.tsx` modified to include videos sub-panel
- YouTube thumbnail preview works
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(editor): tour videos sub-section inside itinerary`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
