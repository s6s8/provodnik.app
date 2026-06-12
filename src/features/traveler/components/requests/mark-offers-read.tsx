"use client";

import { useEffect } from "react";

import { markOffersReadAction } from "@/app/(protected)/traveler/requests/[requestId]/actions";

interface MarkOffersReadProps {
  requestId: string;
  hasOffers: boolean;
}

export function MarkOffersRead({ requestId, hasOffers }: MarkOffersReadProps) {
  useEffect(() => {
    if (!hasOffers) return;

    const t = setTimeout(() => {
      void markOffersReadAction(requestId);
    }, 1500);

    return () => clearTimeout(t);
  }, [requestId, hasOffers]);

  return null;
}
