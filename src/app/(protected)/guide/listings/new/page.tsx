import type { Metadata } from "next";

import { GuideListingNewPageClient } from "@/features/guide/components/listings/guide-listing-new-page-client";
import {
  confirmListingPhotoUpload,
  createListingAction,
  getListingUploadUrl,
} from "../actions";

export const metadata: Metadata = {
  title: "Новый тур",
};

export default async function GuideListingNewPage() {
  return (
    <GuideListingNewPageClient
      createAction={createListingAction}
      uploadActions={{
        getUploadUrl: getListingUploadUrl,
        confirmUpload: confirmListingPhotoUpload,
      }}
    />
  );
}
