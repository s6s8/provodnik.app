"use client";

import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingDayRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";
import { VideosSection } from "./VideosSection";

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
  const [loadingDays, setLoadingDays] = useState(true);

  const fetchDays = useCallback(async () => {
    setLoadingDays(true);
    const supabase = getLooseClient();
    const { data, error } = await supabase
      .from("listing_days")
      .select("listing_id, day_number, title, body, date_override")
      .eq("listing_id", listing.id)
      .order("day_number", { ascending: true });
    if (!error && data) {
      setDays(data as ListingDayRow[]);
    }
    setLoadingDays(false);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDays();
  }, [fetchDays]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        {loadingDays ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20 w-full rounded-glass" />
            <Skeleton className="h-20 w-full rounded-glass" />
          </div>
        ) : days.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Дни программы ещё не добавлены.
          </p>
        ) : (
          days.map((day) => (
            <Card key={day.day_number} size="sm" className="p-4">
              <p className="text-sm font-semibold text-foreground">
                День {day.day_number}
                {day.title ? ` — ${day.title}` : ""}
              </p>
              {day.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {day.body}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </div>

      <Separator className="my-6" />
      <div>
        <h3 className="mb-3 text-base font-semibold">Видео тура</h3>
        <VideosSection listingId={listing.id} />
      </div>
    </div>
  );
}
