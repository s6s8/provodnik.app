"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListRow } from "@/components/shared/list-row";
import { EmptyState } from "@/components/shared/empty-state";
import {
  addLocationAction,
  setLocationStatusAction,
} from "@/app/(protected)/admin/locations/actions";
import type { LocationCatalogEntry } from "@/lib/supabase/location-catalog";

export function LocationsConsole({ locations }: { locations: LocationCatalogEntry[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setBusy(true);
    try {
      const result = await addLocationAction(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id: string, next: "active" | "retired") {
    setError(null);
    setBusy(true);
    try {
      const result = await setLocationStatusAction(id, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-border bg-surface-high p-5">
        <Label htmlFor="new-location">Новая локация</Label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <Input
            id="new-location"
            value={name}
            maxLength={80}
            placeholder="Например: Казань"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAdd();
              }
            }}
          />
          <Button type="button" loading={busy} disabled={busy || !name.trim()} onClick={() => void handleAdd()}>
            Добавить
          </Button>
        </div>
        {error ? (
          <Alert role="alert" variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {locations.length === 0 ? (
        <EmptyState
          title="Каталог пуст"
          description="Добавьте первую локацию — гиды смогут выбрать её при создании экскурсий."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {locations.map((location) => (
            <ListRow
              key={location.id}
              href={`/admin/locations/${location.id}`}
              title={location.name}
              subtitle="Медиа локации"
              badge={
                <Badge variant={location.status === "active" ? "default" : "secondary"}>
                  {location.status === "active" ? "Активна" : "В архиве"}
                </Badge>
              }
              actions={
                location.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleToggle(location.id, "retired")}
                  >
                    В архив
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleToggle(location.id, "active")}
                  >
                    Вернуть
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
