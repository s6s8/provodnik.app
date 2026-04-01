"use client";

import * as React from "react";

import type { ListingInput } from "@/lib/supabase/listing-schema";
import { GuideListingEditScreen } from "./guide-listing-edit-screen";

type GuideListingEditPageClientProps = {
  listingId: string;
  defaultValues: Partial<ListingInput>;
  updateAction: (
    id: string,
    data: ListingInput,
  ) => Promise<{ id?: string; error?: string }>;
};

export function GuideListingEditPageClient({
  listingId,
  defaultValues,
  updateAction,
}: GuideListingEditPageClientProps) {
  const handleSubmit = React.useCallback(
    async (data: ListingInput): Promise<string> => {
      const result = await updateAction(listingId, data);
      if (result.error) throw new Error(result.error);
      if (!result.id) throw new Error("Не удалось получить ID тура.");
      return result.id;
    },
    [updateAction, listingId],
  );

  return (
    <GuideListingEditScreen
      listingId={listingId}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    />
  );
}
