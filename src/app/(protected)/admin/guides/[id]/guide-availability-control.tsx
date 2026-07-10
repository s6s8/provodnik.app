"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { setGuideAvailability, type ActionState } from "./actions";

const INITIAL: ActionState = { error: null };

export function GuideAvailabilityControl({
  guideId,
  available,
}: {
  guideId: string;
  available: boolean;
}) {
  const [state, action, pending] = React.useActionState(
    setGuideAvailability.bind(null, guideId, !available),
    INITIAL,
  );

  return (
    <form className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Текущий статус: {available ? "принимает заявки" : "приём приостановлен"}
      </p>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Button
        formAction={action}
        type="submit"
        variant={available ? "outline" : "default"}
        disabled={pending}
        loading={pending}
      >
        {pending
          ? "Сохраняем…"
          : available
            ? "Приостановить приём заявок"
            : "Возобновить приём заявок"}
      </Button>
    </form>
  );
}
