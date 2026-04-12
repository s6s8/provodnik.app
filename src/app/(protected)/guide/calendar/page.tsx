import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyCalendar } from "@/features/guide/components/calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/features/guide/components/calendar/WeeklyCalendar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
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

export default async function GuideCalendarPage() {
  let schedules: ListingScheduleRow[] = [];
  let extras: ListingScheduleExtraRow[] = [];
  let departures: ListingTourDepartureRow[] = [];
  let listings: { id: string; title: string; exp_type: string | null }[] = [];

  try {
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

    const guideId = user.id;

    const { data: listingsRaw } = await supabase
      .from("listings")
      .select("id, title, exp_type")
      .eq("guide_id", guideId)
      .eq("status", "active");

    listings = (listingsRaw ?? []) as {
      id: string;
      title: string | null;
      exp_type: string | null;
    }[];

    const listingIds = listings.map((l) => l.id);

    const today = new Date();
    const todayStr = formatDateOnlyLocal(today);
    const twoMonthsOut = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    const twoMonthsOutStr = formatDateOnlyLocal(twoMonthsOut);

    if (listingIds.length > 0) {
      const [{ data: schedulesRaw }, { data: extrasRaw }, { data: departuresRaw }] =
        await Promise.all([
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
        ]);

      schedules = (schedulesRaw ?? []) as ListingScheduleRow[];
      extras = (extrasRaw ?? []) as ListingScheduleExtraRow[];
      departures = (departuresRaw ?? []) as ListingTourDepartureRow[];
    }
  } catch {
    schedules = [];
    extras = [];
    departures = [];
    listings = [];
  }

  const listingSummaries = listings.map((l) => ({
    id: l.id,
    title: l.title?.trim() ? l.title : "Без названия",
  }));

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-xl">Календарь</CardTitle>
          <p className="text-sm text-muted-foreground">
            Расписание слотов и даты отправлений по вашим активным турам.
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
    </div>
  );
}
