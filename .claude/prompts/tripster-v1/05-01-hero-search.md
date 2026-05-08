# Phase 5.1 — Traveler surfaces: hero search + featured grid

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-1`
**Branch:** `feat/tripster-v1-p5-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Existing home page:** `src/app/(public)/page.tsx` — check this before writing anything.

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Flag registry:**
```ts
import { flags } from "@/lib/flags";
// flags.FEATURE_TRIPSTER_V1 — boolean
```

**Relevant types (from `src/lib/supabase/types.ts`):**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  slug: string;
  title: string;
  region: string;
  city: string | null;
  category: string;
  description: string | null;
  duration_minutes: number | null;
  max_group_size: number;
  price_from_minor: number;
  currency: string;
  status: "draft" | "pending_review" | "active" | "rejected" | "archived";
  featured_rank: number | null;
  exp_type: "excursion" | "waterwalk" | "masterclass" | "photosession" | "quest" | "activity" | "tour" | "transfer" | null;
  format: "group" | "private" | "combo" | null;
  languages: string[];
  average_rating: number;
  review_count: number;
  image_url: string | null;
};
```

**shadcn/ui:** Button, Input, Badge, Card, Select, Skeleton, Separator

## SCOPE

**Modify:**
1. `src/app/(public)/page.tsx` — add hero search + destinations dropdown + featured grid when FEATURE_TRIPSTER_V1

**Create:**
2. `src/components/traveler/HeroSearch.tsx` — single search input with destinations dropdown
3. `src/components/traveler/ListingCard.tsx` — grid card component
4. `src/components/traveler/FeaturedGrid.tsx` — featured listings grid

**DO NOT touch:** Any guide-facing components, editor, admin pages, or auth flows.

## KNOWLEDGE

### Hero search behavior

Search navigates to `/search?q={query}&region={region}`. No server action. Pure navigation.

Regions (popular destinations for dropdown):
- "Москва", "Санкт-Петербург", "Сочи", "Казань", "Нижний Новгород",
  "Калининград", "Екатеринбург", "Байкал", "Алтай", "Карелия"

### Featured grid

Query: `listings` where `status = 'active'` and `featured_rank IS NOT NULL` order by `featured_rank asc` limit 12.

If no featured listings exist, fall back to: `status = 'active'` order by `created_at desc` limit 12.

### ListingCard data

Display:
- `image_url` — cover image (or placeholder gradient if null)
- `title`
- `region` + optional `city`
- `exp_type` badge (Russian label — see table below)
- `price_from_minor ÷ 100` formatted as "от X ₽"
- `duration_minutes` formatted as "N ч" or "N ч M мин"
- `average_rating` (if > 0) — "★ {rating.toFixed(1)}"
- Link to `/listings/{listing.id}`

Russian exp_type labels:
- excursion → "Экскурсия"
- waterwalk → "Прогулка на воде"
- masterclass → "Мастер-класс"
- photosession → "Фотосессия"
- quest → "Квест"
- activity → "Активность"
- tour → "Тур"
- transfer → "Трансфер"

## TASK

### 1. HeroSearch.tsx (client component)

```tsx
"use client";
interface Props {
  regions: string[];
}
```

- Large search Input (placeholder: "Куда хотите поехать?")
- Below input: horizontal scroll of region Badge chips (click fills the input)
- "Найти" Button
- On submit: `router.push(/search?q=${encodeURIComponent(query)}&region=${encodeURIComponent(region)})`
- Style: hero section, centered, large font, full width up to max-w-2xl

### 2. ListingCard.tsx (server or client — use server if no interactivity)

Props:
```ts
interface Props {
  listing: Pick<ListingRow, "id" | "title" | "region" | "city" | "exp_type" | "price_from_minor" | "duration_minutes" | "average_rating" | "image_url">;
}
```

Card layout:
- Aspect ratio 4:3 image at top (use `<img>` with `object-cover`, fall back to `bg-gradient-to-br from-surface-high to-border` placeholder)
- Content below: exp_type badge, title (2-line clamp), region/city, price + duration in one line, rating if > 0
- Entire card is a Next.js `<Link href="/listings/{listing.id}">` with `hover:shadow-md` transition

### 3. FeaturedGrid.tsx (server component)

Props: `{ listings: ListingRow[] }`
Grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
Renders `<ListingCard>` for each.

### 4. Modify page.tsx

The home page is a server component. Add:

```tsx
// At top of component:
if (flags.FEATURE_TRIPSTER_V1) {
  // Fetch featured listings
  const supabase = await createSupabaseServerClient();
  let { data: featured } = await supabase
    .from("listings")
    .select("id, title, region, city, exp_type, price_from_minor, duration_minutes, average_rating, image_url, featured_rank")
    .eq("status", "active")
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: true })
    .limit(12);
  
  if (!featured || featured.length === 0) {
    const { data: recent } = await supabase
      .from("listings")
      .select("id, title, region, city, exp_type, price_from_minor, duration_minutes, average_rating, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);
    featured = recent ?? [];
  }

  const REGIONS = ["Москва","Санкт-Петербург","Сочи","Казань","Нижний Новгород","Калининград","Екатеринбург","Байкал","Алтай","Карелия"];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-surface-high px-4 py-20 text-center">
        <h1 className="font-display mb-4 text-4xl font-bold text-foreground md:text-5xl">
          Найдите идеальный тур
        </h1>
        <p className="mb-8 text-lg text-ink-2">
          Экскурсии, туры, трансферы — от проверенных гидов
        </p>
        <HeroSearch regions={REGIONS} />
      </section>
      {/* Featured */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Популярные предложения</h2>
        <FeaturedGrid listings={featured} />
      </section>
    </main>
  );
}
// existing page content continues below (legacy)
```

Read the existing page.tsx first to understand what the existing return looks like and where to insert the flag check without breaking the legacy path.

## INVESTIGATION RULE

Read before writing:
- `src/app/(public)/page.tsx` — existing page structure
- `src/lib/flags.ts` — exact flags export
- `src/lib/supabase/server.ts` — exact export name

## TDD CONTRACT

No unit tests for UI. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `HeroSearch.tsx`, `ListingCard.tsx`, `FeaturedGrid.tsx` created
- `page.tsx` shows v1 home (hero + featured grid) when FEATURE_TRIPSTER_V1=1
- Legacy path unchanged when FEATURE_TRIPSTER_V1=0
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(traveler): hero search + featured grid (FEATURE_TRIPSTER_V1 gated)`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
