import { GuideListingNewPageClient } from "@/features/guide/components/listings/guide-listing-new-page-client";
import { createListingAction } from "../actions";

export default function GuideListingNewPage() {
  return <GuideListingNewPageClient createAction={createListingAction} />;
}
