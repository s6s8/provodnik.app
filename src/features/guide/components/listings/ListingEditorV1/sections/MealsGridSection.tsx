"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingDayRow, ListingMealRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

const STATUS_LABELS: Record<ListingMealRow["status"], string> = {
  included: "Включено",
  paid_extra: "За доп. плату",
  not_included: "Не включено",
};

export function MealsGridSection({
  listing,
  draft: _draft,
  onChange: _onChange,
  userId: _userId,
}: SectionProps) {
  const [days, setDays] = useState<ListingDayRow[]>([]);
  const [meals, setMeals] = useState<ListingMealRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const supabase = getLooseClient();
    const [daysRes, mealsRes] = await Promise.all([
      supabase
        .from("listing_days")
        .select("*")
        .eq("listing_id", listing.id)
        .order("day_number", { ascending: true }),
      supabase.from("listing_meals").select("*").eq("listing_id", listing.id),
    ]);
    if (!daysRes.error) {
      setDays((daysRes.data as ListingDayRow[] | null) ?? []);
    }
    if (!mealsRes.error) {
      setMeals((mealsRes.data as ListingMealRow[] | null) ?? []);
    }
    setLoading(false);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  const mealMap = useMemo(() => {
    const m = new Map<string, ListingMealRow["status"]>();
    for (const row of meals) {
      m.set(`${row.day_number}:${row.meal_type}`, row.status);
    }
    return m;
  }, [meals]);

  const cellStatus = (
    dayNumber: number,
    mealType: (typeof MEAL_TYPES)[number],
  ): ListingMealRow["status"] => {
    return mealMap.get(`${dayNumber}:${mealType}`) ?? "not_included";
  };

  const onCellChange = async (
    dayNumber: number,
    mealType: (typeof MEAL_TYPES)[number],
    value: ListingMealRow["status"],
  ) => {
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_meals").upsert(
      {
        listing_id: listing.id,
        day_number: dayNumber,
        meal_type: mealType,
        status: value,
        note: null,
      },
      { onConflict: "listing_id,day_number,meal_type" },
    );
    if (!error) {
      setMeals((prev) => {
        const idx = prev.findIndex(
          (r) =>
            r.day_number === dayNumber &&
            r.meal_type === mealType,
        );
        const row: ListingMealRow = {
          listing_id: listing.id,
          day_number: dayNumber,
          meal_type: mealType,
          status: value,
          note: null,
        };
        if (idx === -1) return [...prev, row];
        const next = [...prev];
        next[idx] = row;
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex max-w-4xl flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <p className="max-w-2xl text-sm text-muted-foreground">
        Сначала добавьте программу тура в разделе «Программа»
      </p>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 text-left font-medium text-foreground">
                День
              </th>
              <th className="px-3 py-2 text-left font-medium text-foreground">
                Завтрак
              </th>
              <th className="px-3 py-2 text-left font-medium text-foreground">
                Обед
              </th>
              <th className="px-3 py-2 text-left font-medium text-foreground">
                Ужин
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day_number} className="border-b border-border last:border-0">
                <td className="px-3 py-2 align-middle text-foreground">
                  День {day.day_number}
                  {day.title?.trim() ? `: ${day.title.trim()}` : ""}
                </td>
                {MEAL_TYPES.map((mealType) => {
                  const status = cellStatus(day.day_number, mealType);
                  return (
                    <td key={mealType} className="px-3 py-2 align-middle">
                      <Label className="sr-only" htmlFor={`meal-${day.day_number}-${mealType}`}>
                        {mealType} день {day.day_number}
                      </Label>
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          void onCellChange(
                            day.day_number,
                            mealType,
                            v as ListingMealRow["status"],
                          )
                        }
                      >
                        <SelectTrigger
                          id={`meal-${day.day_number}-${mealType}`}
                          className="w-full min-w-[140px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="included">
                            {STATUS_LABELS.included}
                          </SelectItem>
                          <SelectItem value="paid_extra">
                            {STATUS_LABELS.paid_extra}
                          </SelectItem>
                          <SelectItem value="not_included">
                            {STATUS_LABELS.not_included}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
