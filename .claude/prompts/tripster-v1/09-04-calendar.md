# Phase 9.4 — Guide dashboard: calendar

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-4`
**Branch:** `feat/tripster-v1-p9-4`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase browser client:** `import { createSupabaseBrowserClient } from "@/lib/supabase/client";`

**Relevant types:**
```ts
export type ListingScheduleRow = {
  id: string;
  listing_id: string;
  weekday: number | null;  // 0=Mon...6=Sun
  time_start: string | null;
  time_end: string | null;
};

export type ListingScheduleExtraRow = {
  id: string;
  listing_id: string;
  date: string;  // ISO date YYYY-MM-DD
  time_start: string | null;
  time_end: string | null;
};

export type ListingTourDepartureRow = {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string | null;
  price_minor: number;
  currency: string;
  max_persons: number | null;
  status: "active" | "cancelled" | "sold_out";
};
```

**shadcn/ui:** Button, Badge, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger, TabsContent

## SCOPE

**Create:**
1. `src/app/(protected)/guide/calendar/page.tsx` — calendar page (server, loads data)
2. `src/features/guide/components/calendar/WeeklyCalendar.tsx` — weekly view (client)
3. `src/features/guide/components/calendar/MonthlyCalendar.tsx` — monthly view (client)

**DO NOT touch:** Orders inbox, schedule section in editor.

## TASK

### 1. page.tsx (server component)

Fetch:
```ts
const { data: { user } } = await supabase.auth.getUser();
const guideId = user!.id;

// All active listings for this guide
const { data: listings } = await supabase.from("listings")
  .select("id, title, exp_type")
  .eq("guide_id", guideId)
  .eq("status", "active");

const listingIds = listings?.map(l => l.id) ?? [];

// Schedule slots
const { data: schedules } = await supabase.from("listing_schedule")
  .select("*")
  .in("listing_id", listingIds);

// Schedule extras (current month + next month)
const today = new Date();
const twoMonthsOut = new Date(today.getFullYear(), today.getMonth() + 2, 1);
const { data: extras } = await supabase.from("listing_schedule_extras")
  .select("*")
  .in("listing_id", listingIds)
  .gte("date", today.toISOString().slice(0, 10))
  .lte("date", twoMonthsOut.toISOString().slice(0, 10));

// Tour departures
const { data: departures } = await supabase.from("listing_tour_departures")
  .select("*")
  .in("listing_id", listingIds)
  .gte("start_date", today.toISOString().slice(0, 10));
```

Render Tabs "Неделя" | "Месяц" with WeeklyCalendar and MonthlyCalendar.

### 2. WeeklyCalendar.tsx (client)

Props: `{ schedules: ListingScheduleRow[]; extras: ListingScheduleExtraRow[]; departures: ListingTourDepartureRow[]; listings: { id: string; title: string }[]; }`

Show current week (Mon–Sun). For each day column:
- Weekly schedule slots (from `schedules` where `weekday` matches day index)
- One-off extras for that date
- Tour departures starting on that date

Navigation: "← Предыдущая неделя" / "Следующая неделя →" buttons (client-side, update `weekOffset` state).

### 3. MonthlyCalendar.tsx (client)

Props: same as WeeklyCalendar.

Show a 7×6 grid calendar for current month. Each cell:
- Day number
- Colored dot per listing that has a slot that day (weekly schedule or extra)
- Tour departure marker (different color)

Navigation: "← Предыдущий месяц" / "Следующий →"

Click on day cell → show Dialog with that day's slots listed.

## INVESTIGATION RULE

Read before writing:
- `src/app/(protected)/guide/` — existing guide page structure
- `src/lib/supabase/types.ts` — ListingScheduleRow, ListingScheduleExtraRow, ListingTourDepartureRow

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p9-4`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- Calendar shows weekly and monthly views
- Weekly schedule slots appear on correct days
- Tour departures appear as markers
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(dashboard): guide calendar — weekly/monthly views with schedule + departures`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
