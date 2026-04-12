import type { Metadata } from "next";

import { flags } from "@/lib/flags";
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
  if (flags.FEATURE_TRIPSTER_V1) {
    const { default: PageV1 } = await import("./page-v1");
    return <PageV1 />;
  }

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
