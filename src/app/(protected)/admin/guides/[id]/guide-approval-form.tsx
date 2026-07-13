"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { approveGuide, rejectGuide, requestChanges, type ActionState } from "./actions";

const INITIAL: ActionState = { error: null };

export function GuideApprovalForm({ guideId }: { guideId: string }) {
  const [approveState, approveAction, approvePending] = React.useActionState(
    approveGuide.bind(null, guideId),
    INITIAL,
  );
  const [rejectState, rejectAction, rejectPending] = React.useActionState(
    rejectGuide.bind(null, guideId),
    INITIAL,
  );
  const [changesState, changesAction, changesPending] = React.useActionState(
    requestChanges.bind(null, guideId),
    INITIAL,
  );
  const anyPending = approvePending || rejectPending || changesPending;

  const error = approveState.error ?? rejectState.error ?? changesState.error;
  const success =
    approveState.success ?? rejectState.success ?? changesState.success;

  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="guide-note">Комментарий для гида</Label>
        <Textarea
          id="guide-note"
          name="note"
          rows={4}
          placeholder="Для отклонения / запроса изменений — обязателен"
        />
      </div>

      {error ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          formAction={approveAction}
          type="submit"
          variant="default"
          className="w-full"
          disabled={anyPending}
          loading={approvePending}
        >
          Одобрить гида
        </Button>
        <Button
          formAction={changesAction}
          type="submit"
          variant="outline"
          className="w-full"
          disabled={anyPending}
          loading={changesPending}
        >
          Запросить изменения
        </Button>

        <Separator className="my-1" />

        <Button
          formAction={rejectAction}
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={anyPending}
          loading={rejectPending}
        >
          Отклонить
        </Button>
      </div>
    </form>
  );
}
