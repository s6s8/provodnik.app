import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  GuideDocumentRow,
  GuideVerificationStatusDb,
  ListingMediaRow,
  StorageAssetKindDb,
  StorageAssetRow,
  Uuid,
} from "@/lib/supabase/types";

const GUIDE_DOCUMENT_BLUEPRINTS = [
  { documentType: "identity", suffix: "identity-reserved.txt" },
  { documentType: "address", suffix: "address-reserved.txt" },
  { documentType: "selfie", suffix: "selfie-reserved.txt" },
  { documentType: "certification", suffix: "certification-reserved.txt" },
] as const;

export type GuideDocumentReservation = {
  id: Uuid;
  documentType: string;
  objectPath: string;
  status: GuideVerificationStatusDb;
  createdAt: string;
};

export type ListingMediaReservation = {
  id: Uuid;
  listingId: Uuid;
  objectPath: string;
  isCover: boolean;
  createdAt: string;
};

function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function upsertStorageAsset(input: {
  ownerId: Uuid;
  bucketId: string;
  objectPath: string;
  assetKind: StorageAssetKindDb;
  mimeType?: string | null;
  byteSize?: number | null;
}): Promise<StorageAssetRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("storage_assets")
    .upsert(
      {
        owner_id: input.ownerId,
        bucket_id: input.bucketId,
        object_path: input.objectPath,
        asset_kind: input.assetKind,
        mime_type: input.mimeType ?? "text/plain",
        byte_size: input.byteSize ?? 0,
      },
      { onConflict: "bucket_id,object_path" },
    )
    .select(
      "id, owner_id, bucket_id, object_path, asset_kind, mime_type, byte_size, created_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as StorageAssetRow;
}

export async function ensureGuideDocumentReservations(
  guideId: Uuid,
  status: GuideVerificationStatusDb,
): Promise<GuideDocumentReservation[]> {
  const supabase = getSupabaseClient();
  const { data: existingRows, error: existingError } = await supabase
    .from("guide_documents")
    .select(
      "id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at, storage_assets!inner(object_path)",
    )
    .eq("guide_id", guideId);

  if (existingError) {
    throw existingError;
  }

  const existingByType = new Map<
    string,
    GuideDocumentRow & { storage_assets: { object_path: string } }
  >();

  for (const row of (existingRows ?? []) as Array<
    GuideDocumentRow & { storage_assets: { object_path: string }[] | { object_path: string } }
  >) {
    const storageAsset = firstRelation(row.storage_assets);
    if (!storageAsset) continue;
    existingByType.set(row.document_type, {
      ...row,
      storage_assets: storageAsset,
    });
  }

  for (const blueprint of GUIDE_DOCUMENT_BLUEPRINTS) {
    if (existingByType.has(blueprint.documentType)) continue;

    const asset = await upsertStorageAsset({
      ownerId: guideId,
      bucketId: "guide-media",
      objectPath: `${guideId}/${blueprint.suffix}`,
      assetKind: "guide-document",
    });

    const { data: insertedDocument, error: insertError } = await supabase
      .from("guide_documents")
      .insert({
        guide_id: guideId,
        asset_id: asset.id,
        document_type: blueprint.documentType,
        status,
      })
      .select(
        "id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at, storage_assets!inner(object_path)",
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    const normalizedDocument = insertedDocument as GuideDocumentRow & {
      storage_assets: { object_path: string }[] | { object_path: string };
    };
    const storageAsset = firstRelation(normalizedDocument.storage_assets);

    if (!storageAsset) {
      throw new Error("Guide document reservation did not return a storage path.");
    }

    existingByType.set(blueprint.documentType, {
      ...normalizedDocument,
      storage_assets: storageAsset,
    });
  }

  return [...existingByType.values()]
    .map((row) => ({
      id: row.id,
      documentType: row.document_type,
      objectPath: row.storage_assets.object_path,
      status: row.status,
      createdAt: row.created_at,
    }))
    .sort((a, b) => a.documentType.localeCompare(b.documentType));
}

export async function ensureListingCoverReservation(
  guideId: Uuid,
  listingId: Uuid,
  listingTitle: string,
): Promise<ListingMediaReservation> {
  const supabase = getSupabaseClient();

  const { data: existingRows, error: existingError } = await supabase
    .from("listing_media")
    .select(
      "id, listing_id, asset_id, is_cover, sort_order, alt_text, created_at, storage_assets!inner(object_path)",
    )
    .eq("listing_id", listingId)
    .eq("is_cover", true)
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  const existing = (existingRows?.[0] ?? null) as
    | (ListingMediaRow & {
        storage_assets: { object_path: string }[] | { object_path: string };
      })
    | null;

  const existingStorageAsset = existing ? firstRelation(existing.storage_assets) : null;

  if (existing && existingStorageAsset) {
    return {
      id: existing.id,
      listingId: existing.listing_id,
      objectPath: existingStorageAsset.object_path,
      isCover: existing.is_cover,
      createdAt: existing.created_at,
    };
  }

  const asset = await upsertStorageAsset({
    ownerId: guideId,
    bucketId: "listing-media",
    objectPath: `${guideId}/${listingId}/cover-reserved.txt`,
    assetKind: "listing-cover",
  });

  const { data: insertedMedia, error: insertError } = await supabase
    .from("listing_media")
    .insert({
      listing_id: listingId,
      asset_id: asset.id,
      is_cover: true,
      sort_order: 0,
      alt_text: `${listingTitle} cover`,
    })
    .select(
      "id, listing_id, asset_id, is_cover, sort_order, alt_text, created_at, storage_assets!inner(object_path)",
    )
    .single();

  if (insertError) {
    throw insertError;
  }

  const media = insertedMedia as ListingMediaRow & {
    storage_assets: { object_path: string }[] | { object_path: string };
  };
  const mediaStorageAsset = firstRelation(media.storage_assets);

  if (!mediaStorageAsset) {
    throw new Error("Listing cover reservation did not return a storage path.");
  }

  return {
    id: media.id,
    listingId: media.listing_id,
    objectPath: mediaStorageAsset.object_path,
    isCover: media.is_cover,
    createdAt: media.created_at,
  };
}

export async function listListingMediaReservationsForGuide(
  guideId: Uuid,
): Promise<Record<Uuid, ListingMediaReservation[]>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("listing_media")
    .select(
      "id, listing_id, asset_id, is_cover, sort_order, alt_text, created_at, listings!inner(guide_id), storage_assets!inner(object_path)",
    )
    .eq("listings.guide_id", guideId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  const grouped: Record<Uuid, ListingMediaReservation[]> = {};

  for (const row of (data ?? []) as Array<
    ListingMediaRow & {
      storage_assets: { object_path: string }[] | { object_path: string };
      listings: { guide_id: Uuid }[] | { guide_id: Uuid };
    }
  >) {
    const storageAsset = firstRelation(row.storage_assets);
    if (!storageAsset) continue;
    const current = grouped[row.listing_id] ?? [];
    current.push({
      id: row.id,
      listingId: row.listing_id,
      objectPath: storageAsset.object_path,
      isCover: row.is_cover,
      createdAt: row.created_at,
    });
    grouped[row.listing_id] = current;
  }

  return grouped;
}
