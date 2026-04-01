import { GuideListingNewPageClient } from "@/features/guide/components/listings/guide-listing-new-page-client";
import {
  confirmListingPhotoUpload,
  createListingAction,
  getListingUploadUrl,
} from "../actions";

export default function GuideListingNewPage() {
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
