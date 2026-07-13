"use client";

import * as React from "react";

import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { setGuideAvailabilityAction } from "@/features/guide/actions/setAvailability";

export function GuideAvailabilityToggle({ available }: { available: boolean }) {
  const [isAvailable, setIsAvailable] = React.useState(available);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    const next = !isAvailable;
    setError(null);
    startTransition(async () => {
      const res = await setGuideAvailabilityAction(next);
      if (res.ok) setIsAvailable(next);
      else setError(res.error);
    });
  }

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Приём заявок</p>
        <p className="text-sm text-muted-foreground">
          {isAvailable
            ? "Вы получаете новые заявки и видны в каталоге."
            : "Приём заявок приостановлен. Вас не видно в каталоге, новые заявки не приходят. Текущие бронирования и переписка сохраняются."}
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant={isAvailable ? "outline" : "default"}
        disabled={pending}
        onClick={toggle}
      >
        {isAvailable ? "Приостановить приём заявок" : "Возобновить приём заявок"}
      </Button>
    </GlassCard>
  );
}
