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

      <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>{tripSummary}</p>
        <p>Гид: {guideName}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reason">Причина спора</Label>
        <Textarea
          id="reason"
          name="reason"
          maxLength={2000}
          placeholder="Что пошло не так?"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="requestedOutcome">Желаемый исход</Label>
        <Textarea
          id="requestedOutcome"
          name="requestedOutcome"
          maxLength={2000}
          placeholder="Например: частичный возврат, перенос даты, дополнительная компенсация"
          disabled={pending}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
        ) : null}
        {pending ? "Отправка…" : "Отправить спор"}
      </Button>
    </form>
  );
}
