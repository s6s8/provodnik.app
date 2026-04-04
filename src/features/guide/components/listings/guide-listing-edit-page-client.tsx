"use client";

import * as React from "react";

import type { ListingInput } from "@/lib/supabase/listing-schema";
import { GuideListingEditScreen } from "./guide-listing-edit-screen";
import type { ListingUploadedPhoto } from "./listing-photo-upload-section";

type GuideListingEditPageClientProps = {
  listingId: string;
  defaultValues: Partial<ListingInput>;
  initialPhotos: ListingUploadedPhoto[];
  updateAction: (
    id: string,
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

export function GuideListingEditPageClient({
  listingId,
  defaultValues,
  initialPhotos,
  updateAction,
  uploadActions,
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
      initialPhotos={initialPhotos}
      onSubmit={handleSubmit}
      uploadActions={uploadActions}
    />
  );
}
