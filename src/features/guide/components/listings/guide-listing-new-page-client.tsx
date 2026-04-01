"use client";

import * as React from "react";

import type { ListingInput } from "@/lib/supabase/listing-schema";
import { GuideListingCreateScreen } from "./guide-listing-create-screen";

type GuideListingNewPageClientProps = {
  createAction: (
    data: ListingInput,
  ) => Promise<{ id?: string; error?: string }>;
};

export function GuideListingNewPageClient({
  createAction,
}: GuideListingNewPageClientProps) {
  const handleSubmit = React.useCallback(
    async (data: ListingInput): Promise<string> => {
      const result = await createAction(data);
      if (result.error) throw new Error(result.error);
      if (!result.id) throw new Error("Не удалось получить ID тура.");
      return result.id;
    },
    [createAction],
  );

  return <GuideListingCreateScreen onSubmit={handleSubmit} />;
}
