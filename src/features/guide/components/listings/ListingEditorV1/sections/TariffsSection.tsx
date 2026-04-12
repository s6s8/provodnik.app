"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingTariffRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

function minTariffMinor(rows: ListingTariffRow[]): number | null {
  if (rows.length === 0) return null;
  return Math.min(...rows.map((r) => r.price_minor));
}

export function TariffsSection({
  listing,
  draft: _draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [tariffs, setTariffs] = useState<ListingTariffRow[]>([]);
  const [label, setLabel] = useState("");
  const [priceRubles, setPriceRubles] = useState("");
  const [minPersons, setMinPersons] = useState("");
  const [maxPersons, setMaxPersons] = useState("");

  const fetchTariffs = useCallback(async () => {
    const supabase = getLooseClient();
    const { data } = await supabase
      .from("listing_tariffs")
      .select("id, listing_id, label, price_minor, currency, min_persons, max_persons")
      .eq("listing_id", listing.id);
    setTariffs((data as ListingTariffRow[] | null) ?? []);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTariffs();
  }, [fetchTariffs]);

  useEffect(() => {
    const minP = minTariffMinor(tariffs);
    if (minP != null) {
      onChangeRef.current({ price_from_minor: minP });
    }
  }, [tariffs]);

  const addTariff = async () => {
    const lbl = label.trim();
    if (!lbl) return;
    const rub = Number(priceRubles);
    if (Number.isNaN(rub) || rub < 0) return;
    const minP = minPersons.trim() === "" ? null : Number(minPersons);
    const maxP = maxPersons.trim() === "" ? null : Number(maxPersons);
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_tariffs").insert({
      listing_id: listing.id,
      label: lbl,
      price_minor: rub * 100,
      currency: "RUB",
      min_persons:
        minP != null && !Number.isNaN(minP) ? minP : null,
      max_persons:
        maxP != null && !Number.isNaN(maxP) ? maxP : null,
    });
    if (!error) {
      setLabel("");
      setPriceRubles("");
      setMinPersons("");
      setMaxPersons("");
      void fetchTariffs();
    }
  };

  const deleteTariff = async (row: ListingTariffRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_tariffs")
      .delete()
      .eq("id", row.id);
    if (!error) void fetchTariffs();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {tariffs.map((t) => (
        <Card key={t.id} size="sm" className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{t.label}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(t.price_minor / 100)} ₽
                {t.currency ? ` · ${t.currency}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.min_persons != null || t.max_persons != null
                  ? `Участники: ${t.min_persons ?? "—"}–${t.max_persons ?? "—"}`
                  : "Участники: не задано"}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void deleteTariff(t)}
            >
              Удалить
            </Button>
          </div>
        </Card>
      ))}

      <Card size="sm" className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">Добавить тариф</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tariff-label">Название</Label>
          <Input
            id="tariff-label"
            placeholder="Взрослый, Детский…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tariff-price">Цена (₽)</Label>
          <Input
            id="tariff-price"
            type="number"
            min={0}
            value={priceRubles}
            onChange={(e) => setPriceRubles(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tariff-min">Мин. человек (необязательно)</Label>
            <Input
              id="tariff-min"
              type="number"
              min={1}
              value={minPersons}
              onChange={(e) => setMinPersons(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tariff-max">Макс. человек (необязательно)</Label>
            <Input
              id="tariff-max"
              type="number"
              min={1}
              value={maxPersons}
              onChange={(e) => setMaxPersons(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={() => void addTariff()}>
          Добавить тариф
        </Button>
      </Card>
    </div>
  );
}
