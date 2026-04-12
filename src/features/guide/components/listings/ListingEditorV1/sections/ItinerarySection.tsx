"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingDayRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { cn } from "@/lib/utils";

import type { SectionProps } from "./BasicsSection";

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

export function ItinerarySection({
  listing,
  draft: _draft,
  onChange: _onChange,
  userId: _userId,
}: SectionProps) {
  const [days, setDays] = useState<ListingDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchDays = useCallback(async () => {
    setLoading(true);
    const supabase = getLooseClient();
    const { data, error } = await supabase
      .from("listing_days")
      .select("*")
      .eq("listing_id", listing.id)
      .order("day_number", { ascending: true });
    if (!error) {
      const rows = (data as ListingDayRow[] | null) ?? [];
      setDays(rows);
      setExpanded((prev) => {
        const next = { ...prev };
        for (const d of rows) {
          if (next[d.day_number] === undefined) next[d.day_number] = true;
        }
        return next;
      });
    }
    setLoading(false);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDays();
  }, [fetchDays]);

  const toggleDay = (dayNumber: number) => {
    setExpanded((prev) => {
      const open = prev[dayNumber] !== false;
      return { ...prev, [dayNumber]: !open };
    });
  };

  const patchDay = (dayNumber: number, patch: Partial<ListingDayRow>) => {
    setDays((prev) =>
      prev.map((d) => (d.day_number === dayNumber ? { ...d, ...patch } : d)),
    );
  };

  const saveTitleBody = async (dayNumber: number, title: string, body: string) => {
    const supabase = getLooseClient();
    await supabase
      .from("listing_days")
      .update({ title, body })
      .eq("listing_id", listing.id)
      .eq("day_number", dayNumber);
  };

  const saveDateOverride = async (
    dayNumber: number,
    dateOverride: string | null,
  ) => {
    const supabase = getLooseClient();
    await supabase
      .from("listing_days")
      .update({ date_override: dateOverride })
      .eq("listing_id", listing.id)
      .eq("day_number", dayNumber);
  };

  const addDay = async () => {
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_days").insert({
      listing_id: listing.id,
      day_number: days.length + 1,
      title: "",
      body: "",
    });
    if (!error) void fetchDays();
  };

  const renumberDays = async (remaining: ListingDayRow[]) => {
    const supabase = getLooseClient();
    const sorted = [...remaining].sort((a, b) => a.day_number - b.day_number);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].day_number !== i + 1) {
        await supabase
          .from("listing_days")
          .update({ day_number: i + 1 })
          .eq("listing_id", listing.id)
          .eq("day_number", sorted[i].day_number);
      }
    }
  };

  const deleteDay = async (day: ListingDayRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_days")
      .delete()
      .eq("listing_id", listing.id)
      .eq("day_number", day.day_number);
    if (error) return;
    const { data } = await supabase
      .from("listing_days")
      .select("*")
      .eq("listing_id", listing.id)
      .order("day_number", { ascending: true });
    const remaining = (data as ListingDayRow[] | null) ?? [];
    await renumberDays(remaining);
    void fetchDays();
  };

  if (loading) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {days.map((day) => {
        const isOpen = expanded[day.day_number] !== false;
        const titleDisplay = day.title?.trim() || "Без названия";
        return (
          <Card key={day.day_number} size="sm" className="overflow-hidden p-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/40"
              onClick={() => toggleDay(day.day_number)}
            >
              <span className="font-medium text-foreground">
                День {day.day_number}: {titleDisplay}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`itinerary-title-${day.day_number}`}>Название дня</Label>
                  <Input
                    id={`itinerary-title-${day.day_number}`}
                    value={day.title ?? ""}
                    onChange={(e) => patchDay(day.day_number, { title: e.target.value })}
                    onBlur={(e) => {
                      const title = e.target.value;
                      const body = day.body ?? "";
                      void saveTitleBody(day.day_number, title, body);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`itinerary-body-${day.day_number}`}>Описание</Label>
                  <Textarea
                    id={`itinerary-body-${day.day_number}`}
                    rows={4}
                    value={day.body ?? ""}
                    onChange={(e) => patchDay(day.day_number, { body: e.target.value })}
                    onBlur={(e) => {
                      const body = e.target.value;
                      const title = day.title ?? "";
                      void saveTitleBody(day.day_number, title, body);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`itinerary-date-${day.day_number}`}>
                    Привязать к конкретной дате
                  </Label>
                  <Input
                    id={`itinerary-date-${day.day_number}`}
                    type="date"
                    value={day.date_override ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      patchDay(day.day_number, {
                        date_override: raw === "" ? null : raw,
                      });
                    }}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const v = raw === "" ? null : raw;
                      void saveDateOverride(day.day_number, v);
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void deleteDay(day)}
                  >
                    Удалить день
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={() => void addDay()}>
        Добавить день
      </Button>
    </div>
  );
}
