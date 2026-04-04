import { randomUUID } from "node:crypto";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  userId: z.string().uuid(),
});

const confirmUploadSchema = z.object({
  ownerId: z.string().uuid(),
  bucketId: storageBucketSchema,
  objectPath: z.string().trim().min(1).max(512),
  assetKind: storageAssetKindSchema,
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive(),
});

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

function getFileExtension(fileName: string, mimeType: string) {
  const fileNameParts = fileName.split(".");
  const rawExtension =
    fileNameParts.length > 1 ? fileNameParts.at(-1)?.toLowerCase() ?? null : null;

  if (rawExtension && /^[a-z0-9]+$/i.test(rawExtension)) {
    return rawExtension;
  }

  const mimeExtension = getMimeExtension(mimeType);
  if (mimeExtension) {
    return mimeExtension;
  }

  throw new Error("Не удалось определить расширение файла.");
}

function assertMimeTypeAllowed(bucket: StorageBucketId, mimeType: string) {
  const config = getStorageBucketConfig(bucket);
  if (!config.allowedMimeTypes.includes(mimeType as never)) {
    throw new Error("Недопустимый тип файла для выбранного бакета.");
  }
}

export async function getPresignedUploadUrl(
  bucket: string,
  fileName: string,
  mimeType: string,
  userId: string,
) {
  const input = uploadPathInputSchema.parse({ bucket, fileName, mimeType, userId });
  assertMimeTypeAllowed(input.bucket, input.mimeType);

  const extension = getFileExtension(input.fileName, input.mimeType);
  const path = `${input.userId}/${randomUUID()}.${extension}`;

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

  const supabase = createSupabaseAdminClient();
  const { data: asset, error } = await supabase
    .from("storage_assets")
    .upsert(
      {
        owner_id: input.ownerId,
        bucket_id: input.bucketId,
        object_path: input.objectPath,
        asset_kind: input.assetKind,
        mime_type: input.mimeType,
        byte_size: input.byteSize,
      },
      { onConflict: "bucket_id,object_path" },
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
