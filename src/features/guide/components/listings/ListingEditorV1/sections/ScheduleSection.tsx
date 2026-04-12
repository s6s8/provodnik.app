"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ListingScheduleExtraRow,
  ListingScheduleRow,
} from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: "Пн" },
  { value: 1, label: "Вт" },
  { value: 2, label: "Ср" },
  { value: 3, label: "Чт" },
  { value: 4, label: "Пт" },
  { value: 5, label: "Сб" },
  { value: 6, label: "Вс" },
];

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

export function ScheduleSection({
  listing,
  draft: _draft,
  onChange: _onChange,
  userId: _userId,
}: SectionProps) {
  const [weekly, setWeekly] = useState<ListingScheduleRow[]>([]);
  const [extras, setExtras] = useState<ListingScheduleExtraRow[]>([]);
  const [weekday, setWeekday] = useState("0");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("18:00");
  const [extraDate, setExtraDate] = useState("");
  const [extraStart, setExtraStart] = useState("");
  const [extraEnd, setExtraEnd] = useState("");

  const fetchWeekly = useCallback(async () => {
    const supabase = getLooseClient();
    const { data } = await supabase
      .from("listing_schedule")
      .select("id, listing_id, weekday, time_start, time_end")
      .eq("listing_id", listing.id);
    setWeekly((data as ListingScheduleRow[] | null) ?? []);
  }, [listing.id]);

  const fetchExtras = useCallback(async () => {
    const supabase = getLooseClient();
    const { data } = await supabase
      .from("listing_schedule_extras")
      .select("id, listing_id, date, time_start, time_end")
      .eq("listing_id", listing.id)
      .order("date", { ascending: true });
    setExtras((data as ListingScheduleExtraRow[] | null) ?? []);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWeekly();
    void fetchExtras();
  }, [fetchWeekly, fetchExtras]);

  const addWeekly = async () => {
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_schedule").insert({
      listing_id: listing.id,
      weekday: Number(weekday),
      time_start: timeStart,
      time_end: timeEnd,
    });
    if (!error) void fetchWeekly();
  };

  const deleteWeekly = async (row: ListingScheduleRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_schedule")
      .delete()
      .eq("id", row.id);
    if (!error) void fetchWeekly();
  };

  const addExtra = async () => {
    if (!extraDate.trim()) return;
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_schedule_extras").insert({
      listing_id: listing.id,
      date: extraDate,
      time_start: extraStart.trim() || null,
      time_end: extraEnd.trim() || null,
    });
    if (!error) {
      setExtraDate("");
      setExtraStart("");
      setExtraEnd("");
      void fetchExtras();
    }
  };

  const deleteExtra = async (row: ListingScheduleExtraRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_schedule_extras")
      .delete()
      .eq("id", row.id);
    if (!error) void fetchExtras();
  };

  const weekdayLabel = (n: number | null) =>
    WEEKDAYS.find((w) => w.value === n)?.label ?? "—";

  return (
    <div className="max-w-3xl">
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Расписание</TabsTrigger>
          <TabsTrigger value="extras">Особые даты</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-glass border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3 font-medium">День недели</th>
                  <th className="p-3 font-medium">Начало</th>
                  <th className="p-3 font-medium">Конец</th>
                  <th className="p-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="p-3">{weekdayLabel(row.weekday)}</td>
                    <td className="p-3">{row.time_start}</td>
                    <td className="p-3">{row.time_end}</td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void deleteWeekly(row)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card size="sm" className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">Добавить слот</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>День недели</Label>
                <Select value={weekday} onValueChange={setWeekday}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="slot-start">Начало</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="slot-end">Конец</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" onClick={() => void addWeekly()}>
              Добавить слот
            </Button>
          </Card>
        </TabsContent>
        <TabsContent value="extras" className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-glass border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3 font-medium">Дата</th>
                  <th className="p-3 font-medium">Начало</th>
                  <th className="p-3 font-medium">Конец</th>
                  <th className="p-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {extras.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.time_start ?? "—"}</td>
                    <td className="p-3">{row.time_end ?? "—"}</td>
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void deleteExtra(row)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card size="sm" className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">Добавить дату</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="extra-date">Дата</Label>
                <Input
                  id="extra-date"
                  type="date"
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="extra-t1">Начало (необязательно)</Label>
                <Input
                  id="extra-t1"
                  type="time"
                  value={extraStart}
                  onChange={(e) => setExtraStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="extra-t2">Конец (необязательно)</Label>
                <Input
                  id="extra-t2"
                  type="time"
                  value={extraEnd}
                  onChange={(e) => setExtraEnd(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" onClick={() => void addExtra()}>
              Добавить дату
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
