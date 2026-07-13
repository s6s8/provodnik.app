"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <form className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Текущий статус: {available ? "принимает заявки" : "приём приостановлен"}
      </p>
      {state.error ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert variant="success">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        formAction={action}
        type="submit"
        variant={available ? "outline" : "default"}
        disabled={pending}
        loading={pending}
        className="self-start"
      >
        {available ? "Приостановить приём заявок" : "Возобновить приём заявок"}
      </Button>
    </form>
  );
}
