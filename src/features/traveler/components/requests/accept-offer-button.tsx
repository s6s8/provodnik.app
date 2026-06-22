"use client";

import { startTransition, useActionState } from "react";

import {
  acceptOfferAction,
  type AcceptOfferActionState,
} from "@/features/requests/owner-request-actions";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/confirm-dialog";

const initialState: AcceptOfferActionState = { error: null };

interface AcceptOfferButtonProps {
  offerId: string;
  requestId: string;
  guideId: string;
  priceMinor: number;
  guideName: string;
  /** Per-person price label shown in the confirm description, e.g. "3 200 ₽". */
  perPersonLabel?: string;
}

export function AcceptOfferButton({
  offerId,
  requestId,
  guideId,
  priceMinor,
  guideName,
  perPersonLabel,
}: AcceptOfferButtonProps) {
  const [state, formAction, isPending] = useActionState(
    acceptOfferAction,
    initialState,
  );
  const { confirm, ConfirmDialog } = useConfirm();

  const description = `${
    perPersonLabel ? `${perPersonLabel} / чел. · ` : ""
  }Остальные предложения отклонятся автоматически. Действие нельзя отменить.`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await confirm({
      title: `Выбрать ${guideName}?`,
      description,
      confirmText: "Подтвердить выбор",
      cancelText: "Вернуться",
    });
    if (ok) {
      startTransition(() => formAction(formData));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="guide_id" value={guideId} />
      <input type="hidden" name="price_minor" value={String(priceMinor)} />
      {state.error ? (
        <p className="mb-2 font-sans text-[0.8125rem] text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Обработка…" : "Принять предложение"}
      </Button>
      {ConfirmDialog}
    </form>
  );
}
