"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { approveGuide, rejectGuide, requestChanges, type ActionState } from "./actions";

const INITIAL: ActionState = { error: null };

export function GuideApprovalForm({ guideId }: { guideId: string }) {
  const [approveState, approveAction] = React.useActionState(
    approveGuide.bind(null, guideId),
    INITIAL,
  );
  const [rejectState, rejectAction] = React.useActionState(
    rejectGuide.bind(null, guideId),
    INITIAL,
  );
  const [changesState, changesAction] = React.useActionState(
    requestChanges.bind(null, guideId),
    INITIAL,
  );

  const error = approveState.error ?? rejectState.error ?? changesState.error;
  const success =
    approveState.success ?? rejectState.success ?? changesState.success;

  return (
    <form className="mt-4 space-y-4">
      <textarea
        name="note"
        rows={6}
        className="w-full rounded-[1.25rem] border border-input bg-surface-lowest px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        placeholder="Комментарий для гида или внутренней истории модерации"
      />

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

      <div className="flex flex-wrap gap-2">
        <Button
          formAction={approveAction}
          type="submit"
          variant="secondary"
          className="border-success/30 bg-success/10 text-success hover:bg-success/20"
        >
          Одобрить гида
        </Button>
        <Button
          formAction={changesAction}
          type="submit"
          variant="secondary"
        >
          Запросить доп. документы
        </Button>
        <Button
          formAction={rejectAction}
          type="submit"
          variant="destructive"
        >
          Отклонить
        </Button>
      </div>
    </form>
  );
}
