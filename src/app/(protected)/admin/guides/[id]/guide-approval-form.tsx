"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guide-note">Комментарий для гида</Label>
        <Textarea
          id="guide-note"
          name="note"
          rows={4}
          placeholder="Для отклонения / запроса изменений — обязателен"
        />
      </div>

      {error ? (
        <div className="rounded-[1rem] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[1rem] border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          formAction={approveAction}
          type="submit"
          variant="default"
          className="w-full"
          disabled={anyPending}
          loading={approvePending}
        >
          {approvePending ? "Одобряем…" : "Одобрить гида"}
        </Button>
        <Button
          formAction={changesAction}
          type="submit"
          variant="outline"
          className="w-full"
          disabled={anyPending}
          loading={changesPending}
        >
          {changesPending ? "Запрашиваем…" : "Запросить изменения"}
        </Button>
        <Button
          formAction={rejectAction}
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={anyPending}
          loading={rejectPending}
        >
          {rejectPending ? "Отклоняем…" : "Отклонить"}
        </Button>
      </div>
    </form>
  );
}
