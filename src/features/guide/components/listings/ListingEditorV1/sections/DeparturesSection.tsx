"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingTourDepartureRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "border-success/25 bg-success/12 text-success";
    case "cancelled":
      return "border-border/80 bg-muted text-muted-foreground";
    case "sold_out":
      return "border-warning/25 bg-warning/14 text-warning";
    default:
      return "border-border/80 bg-muted text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Активно";
    case "cancelled":
      return "Отменено";
    case "sold_out":
      return "Мест нет";
    default:
      return status;
  }
}

function formatDateRu(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return isoDate;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU");
}

export function DeparturesSection({
  listing,
  draft: _draft,
  onChange: _onChange,
  userId: _userId,
}: SectionProps) {
  const [rows, setRows] = useState<ListingTourDepartureRow[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceRubles, setPriceRubles] = useState("");
  const [maxPersons, setMaxPersons] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDepartures = useCallback(async () => {
    const supabase = getLooseClient();
    const { data } = await supabase
      .from("listing_tour_departures")
      .select("*")
      .eq("listing_id", listing.id)
      .order("start_date", { ascending: true });
    setRows((data as ListingTourDepartureRow[] | null) ?? []);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDepartures();
  }, [fetchDepartures]);

  const hasActiveDeparture = useMemo(
    () => rows.some((r) => r.status === "active"),
    [rows],
  );

  const showTourGateAlert =
    listing.exp_type === "tour" && !hasActiveDeparture;

  const addDeparture = async () => {
    setFormError(null);
    if (!startDate || !endDate) {
      setFormError("Укажите даты начала и окончания");
      return;
    }
    if (endDate < startDate) {
      setFormError("Дата окончания не может быть раньше даты начала");
      return;
    }
    const rub = Number(priceRubles);
    if (Number.isNaN(rub) || rub < 0) {
      setFormError("Укажите корректную цену в рублях");
      return;
    }
    const mp = maxPersons.trim() === "" ? 1 : Number(maxPersons);
    if (Number.isNaN(mp) || mp < 1) {
      setFormError("Укажите число участников не меньше 1");
      return;
    }

    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_tour_departures").insert({
      listing_id: listing.id,
      start_date: startDate,
      end_date: endDate,
      price_minor: Math.round(rub * 100),
      currency: "RUB",
      max_persons: mp,
      status: "active",
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setStartDate("");
    setEndDate("");
    setPriceRubles("");
    setMaxPersons("1");
    void fetchDepartures();
  };

  const cancelDeparture = async (row: ListingTourDepartureRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_tour_departures")
      .update({ status: "cancelled" })
      .eq("id", row.id);
    if (!error) void fetchDepartures();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {showTourGateAlert ? (
        <Alert>
          <AlertTitle>Внимание</AlertTitle>
          <AlertDescription>
            Для туров требуется хотя бы одна активная дата отправления
          </AlertDescription>
        </Alert>
      ) : null}

      {rows.map((row) => (
        <Card key={row.id} size="sm" className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {formatDateRu(row.start_date)} — {formatDateRu(row.end_date)}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round(row.price_minor / 100)} ₽ · до {row.max_persons} чел.
              </p>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={statusBadgeClass(row.status)}
                >
                  {statusLabel(row.status)}
                </Badge>
              </div>
            </div>
            {row.status !== "cancelled" ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void cancelDeparture(row)}
              >
                Удалить
              </Button>
            ) : null}
          </div>
        </Card>
      ))}

      <Card size="sm" className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">Добавить отправление</p>
        {/* FEATURE_DEPOSITS: deposit_rate field — hidden until payments land */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="departure-start">Дата начала</Label>
            <Input
              id="departure-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="departure-end">Дата окончания</Label>
            <Input
              id="departure-end"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="departure-price">Цена (₽)</Label>
            <Input
              id="departure-price"
              type="number"
              min={0}
              value={priceRubles}
              onChange={(e) => setPriceRubles(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="departure-max">Макс. участников</Label>
            <Input
              id="departure-max"
              type="number"
              min={1}
              value={maxPersons}
              onChange={(e) => setMaxPersons(e.target.value)}
            />
          </div>
        </div>
        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        <Button type="button" onClick={() => void addDeparture()}>
          Добавить
        </Button>
      </Card>
    </div>
  );
}
