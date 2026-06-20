import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { kopecksToRub } from "@/data/money";
import { MonthlyCalendar } from "@/features/guide/components/calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/features/guide/components/calendar/WeeklyCalendar";
import {
  DateRangePicker,
  type DateRangePreset,
} from "@/features/guide/components/statistics/DateRangePicker";
import { StatsChart } from "@/features/guide/components/statistics/StatsChart";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BookingRow,
  ListingScheduleExtraRow,
  ListingScheduleRow,
  ListingTourDepartureRow,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Календарь",
};

function formatDateOnlyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeStartDate(range: DateRangePreset): Date {
  const d = new Date();
  if (range === "7d") d.setDate(d.getDate() - 7);
  else if (range === "90d") d.setDate(d.getDate() - 90);
  else d.setDate(d.getDate() - 30);
  return d;
}

function groupByDay(rows: BookingRow[]): { date: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export default async function GuideCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let schedules: ListingScheduleRow[] = [];
  let extras: ListingScheduleExtraRow[] = [];
  let departures: ListingTourDepartureRow[] = [];
  let listings: { id: string; title: string; exp_type: string | null }[] = [];
  let bookings: BookingRow[] = [];
  let loadFailed = false;

  const resolvedParams = await searchParams;
  const rawRange = resolvedParams.range;
  const range: DateRangePreset =
    rawRange === "7d" || rawRange === "90d" ? rawRange : "30d";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Календарь</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Не удалось загрузить профиль. Обновите страницу или войдите снова.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    const guideId = user.id;

    const { data: listingsRaw } = await supabase
      .from("listings")
      .select("id, title, exp_type")
      .eq("guide_id", guideId)
      .eq("status", "active");

    listings = (listingsRaw ?? []).map((l) => ({
      ...l,
      title: l.title ?? "",
    })) as {
      id: string;
      title: string;
      exp_type: string | null;
    }[];

    const listingIds = listings.map((l) => l.id);

    const todayStr = todayMoscowISODate();
    const [todayYear, todayMonth] = todayStr.split("-").map(Number);
    const twoMonthsOut = new Date(todayYear ?? 0, (todayMonth ?? 1) - 1 + 2, 1);
    const twoMonthsOutStr = formatDateOnlyLocal(twoMonthsOut);
    const rangeStart = formatDateOnlyLocal(rangeStartDate(range));

    const bookingsQuery = supabase
      .from("bookings")
      .select("*")
      .eq("guide_id", guideId)
      .gte("created_at", rangeStart);

    if (listingIds.length > 0) {
      const [
        { data: schedulesRaw },
        { data: extrasRaw },
        { data: departuresRaw },
        { data: bookingsRaw },
      ] = await Promise.all([
        supabase.from("listing_schedule").select("*").in("listing_id", listingIds),
        supabase
          .from("listing_schedule_extras")
          .select("*")
          .in("listing_id", listingIds)
          .gte("date", todayStr)
          .lte("date", twoMonthsOutStr),
        supabase
          .from("listing_tour_departures")
          .select("*")
          .in("listing_id", listingIds)
          .gte("start_date", todayStr),
        bookingsQuery,
      ]);

      schedules = (schedulesRaw ?? []) as ListingScheduleRow[];
      extras = (extrasRaw ?? []) as ListingScheduleExtraRow[];
      departures = (departuresRaw ?? []) as ListingTourDepartureRow[];
      bookings = (bookingsRaw ?? []) as BookingRow[];
    } else {
      const { data: bookingsRaw } = await bookingsQuery;
      bookings = (bookingsRaw ?? []) as BookingRow[];
    }
  } catch {
    loadFailed = true;
  }

  const listingSummaries = listings.map((l) => ({
    id: l.id,
    title: l.title?.trim() ? l.title : "Без названия",
  }));

  const activeBookings = bookings.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "awaiting_guide_confirmation" ||
      b.status === "confirmed",
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + kopecksToRub(b.subtotal_minor),
    0,
  );
  const chartData = groupByDay(bookings);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Кабинет гида" title="Календарь" />

      {loadFailed ? (
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки календаря. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">Расписание</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Расписание</CardTitle>
              <p className="text-sm text-muted-foreground">
                Расписание слотов и даты отправлений по вашим активным экскурсиям.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="week">
                <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="week">Неделя</TabsTrigger>
                  <TabsTrigger value="month">Месяц</TabsTrigger>
                </TabsList>
                <TabsContent value="week" className="mt-0">
                  <WeeklyCalendar
                    schedules={schedules}
                    extras={extras}
                    departures={departures}
                    listings={listingSummaries}
                  />
                </TabsContent>
                <TabsContent value="month" className="mt-0">
                  <MonthlyCalendar
                    schedules={schedules}
                    extras={extras}
                    departures={departures}
                    listings={listingSummaries}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card id="stats" className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Статистика</CardTitle>
              <p className="text-sm text-muted-foreground">
                Бронирования и оборот за выбранный период.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <DateRangePicker value={range} />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Всего бронирований</p>
                  <p className="mt-1 text-base font-semibold">{bookings.length}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Активных</p>
                  <p className="mt-1 text-base font-semibold">{activeBookings.length}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Оборот (завершённые)</p>
                  <p className="mt-1 text-base font-semibold">
                    {totalRevenue > 0
                      ? new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                          currencyDisplay: "symbol",
                          maximumFractionDigits: 0,
                        }).format(totalRevenue)
                      : "—"}
                  </p>
                </div>
              </div>
              {chartData.length > 0 ? (
                <StatsChart data={chartData} label="Бронирований в день" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет данных за выбранный период.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
