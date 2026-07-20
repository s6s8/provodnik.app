import { randomUUID } from "node:crypto";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StorageAssetRow, StorageAssetKindDb } from "@/lib/supabase/types";
import {
  getStorageBucketConfig,
  isPublicStorageBucket,
  storageBucketSchema,
  type StorageBucketId,
} from "@/lib/storage/buckets";

const storageAssetKindSchema = z.enum([
  "guide-avatar",
  "guide-document",
  "listing-cover",
  "listing-gallery",
  "dispute-evidence",
]);

const uploadPathInputSchema = z.object({
  bucket: storageBucketSchema,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
});

/** Matches `storage_assets` unique constraint `(bucket_id, object_path)`. */
export const STORAGE_ASSET_UPSERT_ON_CONFLICT = "bucket_id,object_path" as const;

const confirmUploadSchema = z.object({
  ownerId: z.string().uuid(),
  bucketId: storageBucketSchema,
  objectPath: z.string().trim().min(1).max(512),
  assetKind: storageAssetKindSchema,
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive(),
});

const bucketAssetKinds: Record<StorageBucketId, readonly StorageAssetKindDb[]> = {
  "guide-avatars": ["guide-avatar"],
  "traveler-avatars": [],
  "guide-documents": ["guide-document"],
  "listing-media": ["listing-cover", "listing-gallery"],
  // Location media keeps its editorial metadata on `location_media`, not `storage_assets`,
  // so no asset kind routes here.
  "location-media": [],
  "dispute-evidence": ["dispute-evidence"],
};

function getMimeExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return null;
  }
}

function getFileExtension(mimeType: string) {
  const mimeExtension = getMimeExtension(mimeType);
  if (mimeExtension) {
    return mimeExtension;
  }

  throw new Error("Не удалось определить расширение файла.");
}

export function assertMimeTypeAllowed(bucket: StorageBucketId, mimeType: string) {
  const config = getStorageBucketConfig(bucket);
  if (!config.allowedMimeTypes.includes(mimeType as never)) {
    throw new Error("Недопустимый тип файла для выбранного бакета.");
  }
}

export function assertByteSizeAllowed(bucket: StorageBucketId, byteSize: number) {
  const config = getStorageBucketConfig(bucket);
  if (byteSize > config.maxBytes) {
    throw new Error("Файл превышает лимит выбранного бакета.");
  }
}

function assertAssetKindAllowed(bucket: StorageBucketId, assetKind: StorageAssetKindDb) {
  if (!bucketAssetKinds[bucket].includes(assetKind)) {
    throw new Error("Тип файла не соответствует выбранному бакету.");
  }
}

function assertObjectPathOwnedByUser(objectPath: string, userId: string) {
  const [ownerPrefix] = objectPath.split("/");
  if (ownerPrefix !== userId) {
    throw new Error("Путь файла не соответствует текущему пользователю.");
  }
}

function assertObjectPathMatchesMimeType(objectPath: string, mimeType: string) {
  const extension = getFileExtension(mimeType);
  if (!objectPath.toLowerCase().endsWith(`.${extension}`)) {
    throw new Error("Путь файла не соответствует типу файла.");
  }
}

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw error ?? new Error("Не авторизован.");
  }

  return user.id;
}

export async function getPresignedUploadUrl(
  bucket: string,
  fileName: string,
  mimeType: string,
  _userId: string,
) {
  const input = uploadPathInputSchema.parse({ bucket, fileName, mimeType });
  assertMimeTypeAllowed(input.bucket, input.mimeType);

  const extension = getFileExtension(input.mimeType);
  const ownerId = await getAuthenticatedUserId();
  const path = `${ownerId}/${randomUUID()}.${extension}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(input.bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw error ?? new Error("Не удалось получить ссылку для загрузки.");
  }

  return {
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function confirmUpload(data: {
  ownerId: string;
  bucketId: string;
  objectPath: string;
  assetKind: StorageAssetKindDb;
  mimeType: string;
  byteSize: number;
}): Promise<StorageAssetRow> {
  const input = confirmUploadSchema.parse(data);
  assertMimeTypeAllowed(input.bucketId, input.mimeType);
  assertByteSizeAllowed(input.bucketId, input.byteSize);
  assertAssetKindAllowed(input.bucketId, input.assetKind);
  assertObjectPathMatchesMimeType(input.objectPath, input.mimeType);

  const ownerId = await getAuthenticatedUserId();
  assertObjectPathOwnedByUser(input.objectPath, ownerId);

  const supabase = createSupabaseAdminClient();
  const { data: asset, error } = await supabase
    .from("storage_assets")
    .upsert(
      {
        owner_id: ownerId,
        bucket_id: input.bucketId,
        object_path: input.objectPath,
        asset_kind: input.assetKind,
        mime_type: input.mimeType,
        byte_size: input.byteSize,
      },
      { onConflict: STORAGE_ASSET_UPSERT_ON_CONFLICT },
    )
    .select(
      "id, owner_id, bucket_id, object_path, asset_kind, mime_type, byte_size, created_at",
    )
    .single();

  if (error || !asset) {
    throw error ?? new Error("Не удалось подтвердить загрузку файла.");
  }

  return asset as StorageAssetRow;
}

export function getPublicUrl(bucket: string, path: string) {
  const parsedBucket = storageBucketSchema.parse(bucket);
  if (!isPublicStorageBucket(parsedBucket)) {
    throw new Error("Для приватного бакета нельзя получить публичную ссылку.");
  }

  const supabase = createSupabaseAdminClient();
  const { data } = supabase.storage.from(parsedBucket).getPublicUrl(path);
  return data.publicUrl;
}
