"use client";

import { useActionState } from "react";

import {
  rejectOfferAction,
  type RejectOfferActionState,
} from "@/features/requests/owner-request-actions";
import { Button } from "@/components/ui/button";

const initialState: RejectOfferActionState = { error: null };

interface RejectOfferButtonProps {
  offerId: string;
  requestId: string;
}

export function RejectOfferButton({ offerId, requestId }: RejectOfferButtonProps) {
  const [state, formAction, isPending] = useActionState(rejectOfferAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="request_id" value={requestId} />
      {state.error ? (
        <p className="mb-2 font-sans text-[0.8125rem] text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Обработка…" : "Отклонить"}
      </Button>
    </form>
  );
}
