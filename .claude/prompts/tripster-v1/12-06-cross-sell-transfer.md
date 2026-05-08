# Phase 12.6 — Cross-sell transfer widget on excursion/tour detail pages

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-6`
**Branch:** `feat/tripster-v1-p12-6`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**shadcn/ui:** Badge, Card, Button, Separator

## SCOPE

**Create:**
1. `src/features/listings/components/TransferCrossSellWidget.tsx` — async server component

**Modify:**
2. Excursion shape detail page (find in `src/app/(public)/listings/[id]/` or `src/features/listings/`) — add `<TransferCrossSellWidget>`
3. Tour shape detail page — same

**DO NOT touch:** Transfer detail page (Phase 5.5).

## TASK

### 1. TransferCrossSellWidget.tsx (async server component)

```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  region: string;
  currentListingId: string;
};

export async function TransferCrossSellWidget({ region, currentListingId }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: transfers } = await supabase
    .from("listings")
    .select("id, title, price_from_minor, image_url, vehicle_type, max_group_size")
    .eq("status", "active")
    .eq("exp_type", "transfer")
    .eq("region", region)
    .neq("id", currentListingId)
    .limit(3);
  
  if (!transfers || transfers.length === 0) return null;
  
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Трансфер в регионе</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {transfers.map((t) => (
          <a key={t.id} href={`/listings/${t.id}`}
            className="block rounded-glass border border-border hover:shadow-glass transition-shadow overflow-hidden">
            {t.image_url && (
              <img src={t.image_url} alt={t.title}
                className="w-full aspect-video object-cover" />
            )}
            <div className="p-3 flex flex-col gap-1">
              <p className="text-sm font-medium line-clamp-2">{t.title}</p>
              {t.vehicle_type && (
                <Badge variant="secondary" className="w-fit text-xs">{t.vehicle_type}</Badge>
              )}
              <p className="text-sm text-muted-foreground">
                от {Math.round(t.price_from_minor / 100)} ₽
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

### 2. Add to excursion detail template

Find the excursion-shape detail page (check `src/app/(public)/listings/[id]/` for a file that handles excursion/waterwalk/masterclass/photosession/quest/activity types). Add before the closing tag:

```tsx
<Separator className="my-8" />
<TransferCrossSellWidget region={listing.region} currentListingId={listing.id} />
```

### 3. Add to tour detail template

Find the tour detail page. Add the same widget.

## INVESTIGATION RULE

Read before writing:
- `src/app/(public)/listings/[id]/` — find excursion and tour detail templates
- `src/lib/supabase/types.ts` — ListingRow fields (region, exp_type)

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p12-6`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- TransferCrossSellWidget shows up to 3 transfers in the same region
- Widget renders null when no transfers found
- Widget added to excursion + tour detail pages
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(cross-sell): transfer cross-sell widget on excursion + tour detail pages`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
