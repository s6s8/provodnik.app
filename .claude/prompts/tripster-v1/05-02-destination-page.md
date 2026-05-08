# Phase 5.2 — Traveler surfaces: destination page + search

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-2`
**Branch:** `feat/tripster-v1-p5-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Relevant types (from `src/lib/supabase/types.ts`):**
```ts
export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  region: string;
  city: string | null;
  description: string | null;
  exp_type: "excursion" | "waterwalk" | "masterclass" | "photosession" | "quest" | "activity" | "tour" | "transfer" | null;
  format: "group" | "private" | "combo" | null;
  duration_minutes: number | null;
  max_group_size: number;
  price_from_minor: number;
  currency: string;
  status: string;
  languages: string[];
  difficulty_level: "easy" | "medium" | "hard" | "extreme" | null;
  average_rating: number;
  review_count: number;
  image_url: string | null;
  featured_rank: number | null;
};
```

**shadcn/ui:** Button, Input, Badge, Select, Skeleton, Separator

## SCOPE

**Create:**
1. `src/app/(public)/search/page.tsx` — server component search/destination page
2. `src/components/traveler/FilterBar.tsx` — client component filter chips
3. `src/components/traveler/ListingGrid.tsx` — grid wrapper with pagination

**DO NOT touch:** HeroSearch.tsx, ListingCard.tsx, FeaturedGrid.tsx (from 5.1), any guide/admin files.

**Prerequisite:** `src/components/traveler/ListingCard.tsx` exists from wave 5.1.

## TASK

### 1. `/search/page.tsx` (server component)

URL params: `?q=&region=&type=&format=&min_price=&max_price=&duration=&sort=`

```tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  // Parse filters from sp
  // Query Supabase server-side (base query + filters)
  // Return page with FilterBar + ListingGrid
}
```

**Supabase query:**
```ts
const supabase = await createSupabaseServerClient();
let query = supabase
  .from("listings")
  .select("id, slug, title, region, city, exp_type, format, duration_minutes, price_from_minor, currency, average_rating, review_count, image_url, languages, difficulty_level")
  .eq("status", "active");

if (sp.q) query = query.ilike("title", `%${sp.q}%`);
if (sp.region) query = query.eq("region", sp.region);
if (sp.type) query = query.eq("exp_type", sp.type);
if (sp.format) query = query.eq("format", sp.format);
if (sp.min_price) query = query.gte("price_from_minor", Number(sp.min_price) * 100);
if (sp.max_price) query = query.lte("price_from_minor", Number(sp.max_price) * 100);

// Sort
const sort = sp.sort ?? "featured";
if (sort === "price_asc") query = query.order("price_from_minor", { ascending: true });
else if (sort === "price_desc") query = query.order("price_from_minor", { ascending: false });
else if (sort === "rating") query = query.order("average_rating", { ascending: false });
else query = query.order("featured_rank", { ascending: true, nullsFirst: false });

const { data: listings } = await query.limit(48);
```

Page layout:
```
[SearchPage]
  Title: "{q}" в {region} (or "Все предложения")
  [FilterBar] — receives current filters, navigates on change
  [ListingGrid listings={listings} />
  [if listings.length === 0]: "Ничего не найдено по вашему запросу" + "Сбросить фильтры" Button
```

### 2. FilterBar.tsx (client component)

Props:
```ts
interface Props {
  currentType?: string;
  currentFormat?: string;
  currentSort?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  q?: string;
  region?: string;
}
```

Uses `useRouter` + `usePathname` to navigate with updated searchParams on filter change.

Filters (horizontal scroll on mobile):

**Type chips** (Badge toggle, multi-select NOT supported — single select):
- All (clear type), Экскурсия, Прогулка на воде, Мастер-класс, Фотосессия, Квест, Активность, Тур, Трансфер

**Format chips:**
- Любой, Групповой, Индивидуальный

**Sort select:**
- "featured" → "По популярности"
- "price_asc" → "Сначала дешевле"
- "price_desc" → "Сначала дороже"
- "rating" → "По рейтингу"

Each chip click rebuilds URL: keep existing params, update the changed one, push router.

### 3. ListingGrid.tsx

Props: `{ listings: ListingRow[] }`
Grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
Renders `<ListingCard listing={listing} />` for each. Import ListingCard from `@/components/traveler/ListingCard`.

## INVESTIGATION RULE

Before writing, read:
- `src/app/(public)/page.tsx` — understand route group structure
- `src/components/traveler/ListingCard.tsx` — exact Props interface (from wave 5.1)
- `src/lib/supabase/server.ts` — export name

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `search/page.tsx`, `FilterBar.tsx`, `ListingGrid.tsx` created
- `/search?q=` returns filtered results server-side
- FilterBar chips navigate with updated searchParams
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(traveler): destination/search page + filter bar`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
