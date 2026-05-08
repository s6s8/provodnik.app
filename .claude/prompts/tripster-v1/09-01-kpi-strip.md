# Phase 9.1 — Guide dashboard: KPI strip

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-1`
**Branch:** `feat/tripster-v1-p9-1`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**ADR-030:** KPI strip uses local Tremor/React charts, NOT DataLens embed.

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Relevant types:**
```ts
// View in DB (read-only):
// v_guide_dashboard_kpi — one row per guide_id
// Columns: guide_id, views_30d, requests_30d, offers_sent_30d,
//          bookings_30d, active_listings, average_rating, response_rate

export type GuideProfileRow = {
  user_id: string;
  average_rating: number;
  response_rate: number;
  review_count: number;
};
```

**shadcn/ui:** Card, Badge, Skeleton, Separator

## SCOPE

**Create:**
1. `src/features/guide/components/dashboard/KpiStrip.tsx` — KPI card row (server component)
2. `src/features/guide/components/dashboard/KpiCard.tsx` — individual metric card

**Modify:**
3. Guide dashboard page (find it in `src/app/(protected)/guide/` — likely `dashboard/page.tsx` or `page.tsx`) — add KpiStrip at the top

**DO NOT touch:** Any listing, booking, or editor components.

## TASK

### 1. KpiCard.tsx

Props:
```ts
interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}
```

Small card with:
- label (muted text, small)
- value (large bold number/text)
- optional subtext below
- optional trend arrow (↑ green / ↓ red)

### 2. KpiStrip.tsx (server component)

Fetches data for current guide. Props: `{ userId: string }`

```ts
const supabase = await createSupabaseServerClient();

// Try the v_guide_dashboard_kpi view first
const { data: kpi } = await supabase
  .from("v_guide_dashboard_kpi")
  .select("*")
  .eq("guide_id", userId)
  .maybeSingle();

// Fallback: compute from guide_profiles
const { data: profile } = await supabase
  .from("guide_profiles")
  .select("average_rating, response_rate, review_count")
  .eq("user_id", userId)
  .maybeSingle();
```

Render 6 `<KpiCard>` in a responsive grid `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`:
1. "Просмотры" — `kpi?.views_30d ?? "–"` — subtext "за 30 дней"
2. "Заявки" — `kpi?.requests_30d ?? "–"` — subtext "за 30 дней"
3. "Предложения" — `kpi?.offers_sent_30d ?? "–"` — subtext "за 30 дней"
4. "Бронирования" — `kpi?.bookings_30d ?? "–"` — subtext "за 30 дней"
5. "Рейтинг" — `profile?.average_rating?.toFixed(1) ?? "–"` — subtext `${profile?.review_count ?? 0} отзывов`
6. "Ответы" — `${Math.round((profile?.response_rate ?? 0) * 100)}%` — subtext "скорость ответа"

If `v_guide_dashboard_kpi` doesn't exist (Supabase returns error), gracefully fall back to zeros with "–" for unknown metrics. Never throw.

### 3. Wire into guide dashboard page

Find the guide dashboard page by reading `src/app/(protected)/guide/`. Add `<KpiStrip userId={userId} />` at the top.

## INVESTIGATION RULE

Before writing, read:
- `src/app/(protected)/guide/` — find dashboard page
- `src/lib/supabase/server.ts` — exact export
- `src/lib/supabase/types.ts` — GuideProfileRow fields

## TDD CONTRACT

No unit tests. TypeScript compile must pass. Graceful fallback if view doesn't exist.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- `KpiStrip.tsx` + `KpiCard.tsx` created
- Guide dashboard shows 6 KPI cards at top
- Graceful fallback if view missing
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(dashboard): KPI strip — 6 metric cards with 30d aggregates`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
