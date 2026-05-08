# Phase 9.2 — Guide dashboard: statistics page

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-2`
**Branch:** `feat/tripster-v1-p9-2`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Sub-flag gate:** `FEATURE_TRIPSTER_KPI`

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`

**Charts:** Use Recharts (already in the project if installed) or a simple SVG sparkline — check `package.json` for Tremor/Recharts. If neither is installed, implement a pure-CSS bar chart using `div` height percentages. DO NOT install new packages.

**shadcn/ui:** Card, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator

## SCOPE

**Create:**
1. `src/app/(protected)/guide/statistics/page.tsx` — statistics page (server component)
2. `src/features/guide/components/statistics/StatsChart.tsx` — time-series bar chart (client)
3. `src/features/guide/components/statistics/DateRangePicker.tsx` — date range selector (client)

**DO NOT touch:** KPI strip (Phase 9.1), orders inbox.

## TASK

### 1. page.tsx (server component)

```ts
import { flags } from "@/lib/flags";
if (!flags.FEATURE_TRIPSTER_KPI) notFound();
```

Fetch data for last 30 days by default:
```ts
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user!.id;

// Count bookings per day (last 30 days)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const { data: bookings } = await supabase
  .from("bookings")
  .select("created_at, status, subtotal_minor")
  .eq("guide_id", userId)
  .gte("created_at", thirtyDaysAgo)
  .order("created_at", { ascending: true });
```

Aggregate by day (JS, not SQL):
```ts
function groupByDay(rows: { created_at: string }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return map;
}
```

Build 30-day array filling zeros for missing days.

Layout:
- Tabs: "Бронирования" | "Выручка"
- `<DateRangePicker>` (client component — presets: "7 дней", "30 дней", "90 дней")
- `<StatsChart data={chartData} label="Бронирования" />` (bar chart)
- Summary cards: total bookings, confirmed, revenue (sum of subtotal_minor for confirmed ÷ 100)

### 2. StatsChart.tsx (client)

Props: `{ data: { date: string; value: number }[]; label: string; }`

If Recharts is available: use `<BarChart>` from recharts.
If NOT available: render a pure-CSS proportional bar chart:

```tsx
const maxVal = Math.max(...data.map(d => d.value), 1);
return (
  <div className="flex h-40 items-end gap-0.5">
    {data.map(d => (
      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
        <div
          className="w-full bg-primary/70 rounded-t-sm"
          style={{ height: `${(d.value / maxVal) * 100}%` }}
          title={`${d.date}: ${d.value}`}
        />
      </div>
    ))}
  </div>
);
```

### 3. DateRangePicker.tsx (client)

Props: `{ value: "7d" | "30d" | "90d"; onChange: (v: "7d" | "30d" | "90d") => void; }`

Simple button group:
```tsx
const OPTIONS = [{ v: "7d", label: "7 дней" }, { v: "30d", label: "30 дней" }, { v: "90d", label: "90 дней" }];
```

Note: The page is a server component so DateRangePicker triggers a URL param update for SSR re-fetch. Use `useRouter().push("?range=30d")` on change.

## INVESTIGATION RULE

Read before writing:
- `package.json` — check if recharts or tremor is installed
- `src/app/(protected)/guide/` — existing guide page structure
- `src/lib/flags.ts` — FEATURE_TRIPSTER_KPI flag

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Statistics page shows booking counts per day as a bar chart
- Date range selector changes the data range (30d default)
- FEATURE_TRIPSTER_KPI=0 returns 404
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(dashboard): statistics page — daily bookings chart with date-range picker`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
