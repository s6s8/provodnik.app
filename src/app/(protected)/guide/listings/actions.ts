"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createListing,
  updateListing,
  publishListing,
  pauseListing,
  softDeleteListing,
  getGuideListing,
} from "@/lib/supabase/listings";
import type { ListingInput } from "@/lib/supabase/listing-schema";
import {
  confirmUpload,
  getPresignedUploadUrl,
  getPublicUrl,
} from "@/lib/storage/upload";

async function getCurrentGuideId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("Не авторизован.");
  }

  return session.user.id;
}

const listingUploadUrlSchema = z.object({
  bucket: z.literal("listing-media"),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
});

const listingUploadConfirmSchema = z.object({
  listingId: z.string().uuid(),
  objectPath: z.string().trim().min(1).max(512),
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive(),
});

export async function createListingAction(
  data: ListingInput,
): Promise<{ id?: string; error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    const listing = await createListing(data, guideId);
    return { id: listing.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка создания тура.",
    };
  }
}

export async function updateListingAction(
  id: string,
  data: ListingInput,
): Promise<{ id?: string; error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    const listing = await updateListing(id, data, guideId);
    return { id: listing.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка обновления тура.",
    };
  }
}

export async function publishListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await publishListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка публикации тура.",
    };
  }
}

export async function pauseListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await pauseListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка приостановки тура.",
    };
  }
}

export async function deleteListingAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const guideId = await getCurrentGuideId();
    await softDeleteListing(id, guideId);
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Ошибка удаления тура.",
    };
  }
}

export async function getListingUploadUrl(
  bucket: string,
  fileName: string,
  mimeType: string,
) {
  const input = listingUploadUrlSchema.parse({ bucket, fileName, mimeType });
  const guideId = await getCurrentGuideId();

  return getPresignedUploadUrl(
    input.bucket,
    input.fileName,
    input.mimeType,
    guideId,
  );
}

export async function confirmListingPhotoUpload(data: {
  listingId: string;
  objectPath: string;
  mimeType: string;
  byteSize: number;
}) {
  const input = listingUploadConfirmSchema.parse(data);
  const guideId = await getCurrentGuideId();
  const supabase = await createSupabaseServerClient();
  const listing = await getGuideListing(input.listingId, guideId);

  if (!listing) {
    throw new Error("Тур не найден или недоступен для редактирования.");
  }

  const { count, error: countError } = await supabase
    .from("listing_media")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", input.listingId);

  if (countError) {
    throw countError;
  }

  const isCover = (count ?? 0) === 0;
  const asset = await confirmUpload({
    ownerId: guideId,
    bucketId: "listing-media",
    objectPath: input.objectPath,
    assetKind: isCover ? "listing-cover" : "listing-gallery",
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  const { data: media, error } = await supabase
    .from("listing_media")
    .insert({
      listing_id: input.listingId,
      asset_id: asset.id,
      is_cover: isCover,
      sort_order: count ?? 0,
      alt_text: listing.title,
    })
    .select("id, is_cover, storage_assets!inner(object_path)")
    .single();

  if (error || !media) {
    throw error ?? new Error("Не удалось привязать фото к туру.");
  }

  const storageRelation = Array.isArray(media.storage_assets)
    ? media.storage_assets[0]
    : media.storage_assets;
  const objectPath = storageRelation?.object_path ?? input.objectPath;
  const publicUrl = getPublicUrl("listing-media", objectPath);

  revalidatePath(`/guide/listings/${input.listingId}`);
  revalidatePath(`/guide/listings/${input.listingId}/edit`);

  return {
    id: media.id,
    objectPath,
    publicUrl,
    isCover: media.is_cover,
  };
}
