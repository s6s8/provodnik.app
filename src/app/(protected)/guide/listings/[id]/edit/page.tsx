import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuideListing } from "@/lib/supabase/listings";
import { GuideListingEditPageClient } from "@/features/guide/components/listings/guide-listing-edit-page-client";
import type { ListingUploadedPhoto } from "@/features/guide/components/listings/listing-photo-upload-section";
import { getPublicUrl } from "@/lib/storage/upload";
import {
  confirmListingPhotoUpload,
  getListingUploadUrl,
  updateListingAction,
} from "../../actions";

export const metadata: Metadata = {
  title: "Редактировать тур",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GuideListingEditPage({ params }: Props) {
  if (flags.FEATURE_TR_V1) {
    const { default: PageV1 } = await import("./page-v1");
    return <PageV1 params={params} />;
  }

  const { id } = await params;

  let defaultValues = {};
  let initialPhotos: ListingUploadedPhoto[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return notFound();
    }

    const listing = await getGuideListing(id, session.user.id);

    if (!listing) {
      return notFound();
    }

    const durationDays =
      listing.duration_minutes !== null
        ? Math.max(1, Math.round(listing.duration_minutes / 60 / 24))
        : 1;

    defaultValues = {
      title: listing.title,
      description: listing.description ?? "",
      destination: listing.region,
      price_per_person: Math.round(listing.price_from_minor / 100),
      max_group_size: listing.max_group_size,
      duration_days: durationDays,
      included: listing.inclusions?.join(", ") ?? "",
      excluded: listing.exclusions?.join(", ") ?? "",
    };

    const { data: mediaRows } = await supabase
      .from("listing_media")
      .select("id, is_cover, storage_assets!inner(object_path)")
      .eq("listing_id", id)
      .order("sort_order", { ascending: true });

    initialPhotos = ((mediaRows ?? []) as Array<{
      id: string;
      is_cover: boolean;
      storage_assets:
        | { object_path: string }
        | Array<{ object_path: string }>;
    }>).map((row) => {
      const asset = Array.isArray(row.storage_assets)
        ? row.storage_assets[0]
        : row.storage_assets;
      const objectPath = asset?.object_path ?? "";

      return {
        id: row.id,
        objectPath,
        publicUrl: getPublicUrl("listing-media", objectPath),
        isCover: row.is_cover,
      };
    });
  } catch {
    // Supabase not configured â€” show empty form
  }

  return (
    <GuideListingEditPageClient
      listingId={id}
      defaultValues={defaultValues}
      initialPhotos={initialPhotos}
      updateAction={updateListingAction}
      uploadActions={{
        getUploadUrl: getListingUploadUrl,
        confirmUpload: confirmListingPhotoUpload,
      }}
    />
  );
}
