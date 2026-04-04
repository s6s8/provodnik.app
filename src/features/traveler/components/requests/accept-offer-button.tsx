"use client";

import { useActionState } from "react";
import { acceptOfferAction, type AcceptOfferActionState } from "@/app/(protected)/traveler/requests/[requestId]/actions";

const initialState: AcceptOfferActionState = { error: null };

interface AcceptOfferButtonProps {
  offerId: string;
  requestId: string;
  guideId: string;
  priceMinor: number;
}

export function AcceptOfferButton({
  offerId,
  requestId,
  guideId,
  priceMinor,
}: AcceptOfferButtonProps) {
  const [state, formAction, isPending] = useActionState(acceptOfferAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="guide_id" value={guideId} />
      <input type="hidden" name="price_minor" value={String(priceMinor)} />
      {state.error ? (
        <p className="offer-accept-error">{state.error}</p>
      ) : null}
      <button
        type="submit"
        className="btn-primary"
        disabled={isPending}
      >
        {isPending ? "Обработка…" : "Принять предложение"}
      </button>
    </form>
  );
}
