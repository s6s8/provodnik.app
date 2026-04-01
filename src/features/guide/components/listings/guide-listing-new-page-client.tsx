"use client";

import * as React from "react";

import type { ListingInput } from "@/lib/supabase/listing-schema";
import { GuideListingCreateScreen } from "./guide-listing-create-screen";
import type { ListingUploadedPhoto } from "./listing-photo-upload-section";

type GuideListingNewPageClientProps = {
  createAction: (
    data: ListingInput,
  ) => Promise<{ id?: string; error?: string }>;
  uploadActions: {
    getUploadUrl: (
      bucket: string,
      fileName: string,
      mimeType: string,
    ) => Promise<{ path: string; token: string; signedUrl: string }>;
    confirmUpload: (data: {
      listingId: string;
      objectPath: string;
      mimeType: string;
      byteSize: number;
    }) => Promise<ListingUploadedPhoto>;
  };
};

export function GuideListingNewPageClient({
  createAction,
  uploadActions,
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

  return (
    <GuideListingCreateScreen
      onSubmit={handleSubmit}
      uploadActions={uploadActions}
    />
  );
}
