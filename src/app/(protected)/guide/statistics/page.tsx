import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DateRangePicker,
  type DateRangePreset,
} from "@/features/guide/components/statistics/DateRangePicker";
import { StatsChart } from "@/features/guide/components/statistics/StatsChart";
import { flags } from "@/lib/flags";
import type { BookingStatus } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Статистика",
};

type BookingRow = {
  created_at: string;
  status: BookingStatus;
  subtotal_minor: number;
};

function groupByDay(rows: { created_at: string }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return map;
}

function groupRevenueMinorByDay(rows: BookingRow[]) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    if (r.status !== "confirmed") continue;
    const day = r.created_at.slice(0, 10);
    map[day] = (map[day] ?? 0) + r.subtotal_minor;
  }
  return map;
}

function rangeDayKeys(dayCount: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const d = today.getUTCDate();
  for (let i = dayCount - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m, d - i));
    keys.push(dt.toISOString().slice(0, 10));
  }
  return keys;
}

function parseRange(
  raw: string | string[] | undefined,
): { preset: DateRangePreset; days: number } {
  const v = typeof raw === "string" ? raw : "30d";
  if (v === "7d") return { preset: "7d", days: 7 };
  if (v === "90d") return { preset: "90d", days: 90 };
  return { preset: "30d", days: 30 };
}

function parseTab(raw: string | string[] | undefined): "bookings" | "revenue" {
  const v = typeof raw === "string" ? raw : "bookings";
  return v === "revenue" ? "revenue" : "bookings";
}

export default async function GuideStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!flags.FEATURE_TR_KPI) notFound();

  const params = await searchParams;
  const { preset: rangePreset, days: rangeDays } = parseRange(params.range);
  const tab = parseTab(params.tab);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const userId = user.id;
  const cutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("created_at, status, subtotal_minor")
    .eq("guide_id", userId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });

  const rows = (bookings ?? []) as BookingRow[];

  const dayKeys = rangeDayKeys(rangeDays);
  const countsByDay = groupByDay(rows);
  const revenueMinorByDay = groupRevenueMinorByDay(rows);

  const chartData =
    tab === "bookings"
      ? dayKeys.map((date) => ({ date, value: countsByDay[date] ?? 0 }))
      : dayKeys.map((date) => ({
          date,
          value: (revenueMinorByDay[date] ?? 0) / 100,
        }));

  const totalBookings = rows.length;
  const confirmedCount = rows.filter((r) => r.status === "confirmed").length;
  const revenueMajor =
    rows
      .filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + r.subtotal_minor, 0) / 100;

  const chartLabel = tab === "bookings" ? "Бронирования" : "Выручка";

  const queryBase = `range=${rangePreset}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Бронирования и выручка за выбранный период.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Показатель">
          <Button
            asChild
            size="sm"
            variant={tab === "bookings" ? "default" : "outline"}
            role="tab"
            aria-selected={tab === "bookings"}
          >
            <Link href={`/guide/statistics?${queryBase}&tab=bookings`}>Бронирования</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={tab === "revenue" ? "default" : "outline"}
            role="tab"
            aria-selected={tab === "revenue"}
          >
            <Link href={`/guide/statistics?${queryBase}&tab=revenue`}>Выручка</Link>
          </Button>
        </div>
        <DateRangePicker value={rangePreset} />
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">По дням</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsChart data={chartData} label={chartLabel} />
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Всего бронирований</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totalBookings}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Подтверждено</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {confirmedCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Выручка (подтверждено)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {revenueMajor.toLocaleString("ru-RU", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
