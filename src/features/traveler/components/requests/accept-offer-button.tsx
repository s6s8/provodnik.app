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
  guideName: string;
  /** Per-person price label shown in the confirm description, e.g. "3 200 ₽". */
  perPersonLabel?: string;
}

export function AcceptOfferButton({
  offerId,
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
      {/* Only the offer id is trusted; the server derives guide + price from the
          offer row inside accept_offer, so guide_id/price_minor are no longer sent. */}
      <input type="hidden" name="offer_id" value={offerId} />
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
