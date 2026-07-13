"use client";

import { useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { submitDispute } from "./actions";

type DisputeFormProps = {
  bookingId: string;
  hasError: boolean;
  tripSummary: string;
  guideName: string;
};

export function DisputeForm({ bookingId, hasError, tripSummary, guideName }: DisputeFormProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await submitDispute(bookingId, formData);
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-5">
      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>Проверьте поля формы</AlertTitle>
          <AlertDescription>
            Причина спора обязательна, а желаемый исход можно оставить пустым.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-ink-2">
        <p>{tripSummary}</p>
        <p>Гид: {guideName}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reason" className="text-foreground">
          Причина спора <span className="text-destructive">*</span>
        </Label>
        <p id="reason-hint" className="text-sm text-muted-foreground">
          Что пошло не так? Опишите факты и даты.
        </p>
        <Textarea
          id="reason"
          name="reason"
          maxLength={2000}
          disabled={pending}
          aria-invalid={hasError}
          aria-describedby={hasError ? "reason-error" : "reason-hint"}
        />
        {hasError ? (
          <p id="reason-error" role="alert" className="text-sm text-destructive">
            Укажите причину спора.
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="requestedOutcome" className="text-foreground">
          Желаемый исход (необязательно)
        </Label>
        <p id="requested-outcome-hint" className="text-sm text-muted-foreground">
          Например: частичный возврат, перенос даты, дополнительная компенсация.
        </p>
        <Textarea
          id="requestedOutcome"
          name="requestedOutcome"
          maxLength={2000}
          disabled={pending}
          aria-describedby="requested-outcome-hint"
        />
      </div>

      <Button type="submit" loading={pending}>
        Отправить спор
      </Button>
    </form>
  );
}
