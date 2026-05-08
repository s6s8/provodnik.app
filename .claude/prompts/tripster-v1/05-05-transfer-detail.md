# Phase 5.5 — Traveler: transfer listing detail template

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-5`
**Branch:** `feat/tripster-v1-p5-5`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_V1`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Relevant types** (from `src/lib/supabase/types.ts`):
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  title: string;
  description: string | null;
  region: string;
  city: string | null;
  exp_type: "excursion"|"waterwalk"|"masterclass"|"photosession"|"quest"|"activity"|"tour"|"transfer"|null;
  format: "group"|"private"|"combo"|null;
  vehicle_type: string | null;
  baggage_allowance: string | null;
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  price_from_minor: number;
  currency: string;
  max_group_size: number;
  duration_minutes: number | null;
  average_rating: number;
  review_count: number;
  status: "draft"|"pending_review"|"active"|"rejected"|"archived";
  image_url: string | null;
  created_at: string;
};
```

**shadcn/ui:** Badge, Button, Card, Separator, Skeleton

## SCOPE

**Create:**
1. `src/app/(public)/listings/[id]/transfer/page.tsx` — transfer detail server component

**Modify:**
2. `src/app/(public)/listings/[id]/page.tsx` — add routing: if `listing.exp_type === "transfer"` render the transfer template

**DO NOT touch:** excursion-shape or tour-shape templates.

## TASK

### 1. transfer/page.tsx (server component)

```ts
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_V1) notFound();
```

Fetch:
```ts
const supabase = await createSupabaseServerClient();
const { data: listing } = await supabase
  .from("listings")
  .select("*")
  .eq("id", params.id)
  .eq("status", "active")
  .single();
if (!listing || listing.exp_type !== "transfer") notFound();
```

Layout sections (top to bottom):
1. **Hero**: `listing.image_url` img + title + region/city breadcrumb + status badge
2. **Route summary card**: "Маршрут" section — `pickup_point_text` → `dropoff_point_text` (use arrow icon between them)
3. **Details card**: vehicle_type, max_group_size (capacity), baggage_allowance, duration_minutes (if set)
4. **Price card**: `price_from_minor ÷ 100` ₽ + "За поездку" label + "Забронировать" Button → `/listings/{id}/book`
5. **Description**: `listing.description` (full text)
6. **Cross-sell**: `<TransferCrossSell listing={listing} />` component (see below)

### 2. TransferCrossSell (inline in same file, not exported)

```tsx
// Shows up to 4 excursion listings in same region
async function TransferCrossSell({ listing }: { listing: ListingRow }) {
  const supabase = await createSupabaseServerClient();
  const { data: related } = await supabase
    .from("listings")
    .select("id, title, price_from_minor, image_url, average_rating")
    .eq("status", "active")
    .eq("region", listing.region)
    .in("exp_type", ["excursion","waterwalk","masterclass"])
    .neq("id", listing.id)
    .limit(4);
  if (!related || related.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Экскурсии рядом</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {related.map(r => (
          <a key={r.id} href={`/listings/${r.id}`} className="block rounded-glass border border-border hover:shadow-glass transition-shadow">
            {r.image_url && <img src={r.image_url} alt={r.title} className="w-full aspect-video object-cover rounded-t-glass" />}
            <div className="p-2">
              <p className="text-sm font-medium line-clamp-2">{r.title}</p>
              <p className="text-xs text-muted-foreground">от {Math.round(r.price_from_minor / 100)} ₽</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

### 3. Modify listings/[id]/page.tsx

Read the existing file. Add a branch:
```ts
if (listing.exp_type === "transfer") {
  const { default: TransferPage } = await import("./transfer/page");
  return <TransferPage params={params} />;
}
```

Add this BEFORE the existing excursion/tour routing or as an additional case.

## INVESTIGATION RULE

Read before writing:
- `src/app/(public)/listings/[id]/page.tsx` — understand existing routing
- `src/lib/flags.ts` — confirm FEATURE_TRIPSTER_V1 name
- `src/lib/supabase/types.ts` — confirm ListingRow fields

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-5`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Transfer detail page renders with route, vehicle, price, cross-sell
- `exp_type === "transfer"` routes to transfer template from main listings/[id]/page.tsx
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(traveler): transfer listing detail template + cross-sell excursion grid`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
