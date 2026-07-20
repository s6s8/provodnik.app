"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getStorageBucketConfig } from "@/lib/storage/buckets";
import { getPresignedUploadUrl } from "@/lib/storage/upload";
import {
  LOCATION_MEDIA_BUCKET,
  beginLocationMediaUpload,
  cancelLocationMediaUpload,
  confirmLocationMediaUpload,
  deleteLocationMedia,
  updateLocationMedia,
} from "@/lib/supabase/location-media";
import { requireAdminSession } from "@/lib/supabase/moderation";

export type LocationMediaActionResult = { ok: true } | { ok: false; error: string };
export type LocationMediaUploadStartResult =
  | { ok: true; mediaId: string; signedUrl: string }
  | { ok: false; error: string };

const bucketConfig = getStorageBucketConfig(LOCATION_MEDIA_BUCKET);

const mimeSchema = z.enum(bucketConfig.allowedMimeTypes, {
  message: "Разрешены только JPG, PNG или WEBP.",
});

const textSchema = z.string().trim().max(300).nullable();

const startSchema = z.object({
  locationId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: mimeSchema,
  byteSize: z
    .number()
    .int()
    .positive()
    .max(bucketConfig.maxBytes, "Файл превышает лимит 5 МБ."),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  role: z.enum(["cover", "gallery"]),
  altText: textSchema,
  caption: textSchema,
  source: textSchema,
});

const patchSchema = z.object({
  altText: textSchema.optional(),
  caption: textSchema.optional(),
  source: textSchema.optional(),
  role: z.enum(["cover", "gallery"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  isPrimary: z.boolean().optional(),
});

function actionError(e: unknown, fallback: string): { ok: false; error: string } {
  if (e instanceof z.ZodError) {
    return { ok: false, error: e.issues[0]?.message ?? fallback };
  }
  return { ok: false, error: e instanceof Error ? e.message : fallback };
}

function revalidate(locationId: string) {
  revalidatePath(`/admin/locations/${locationId}`);
  // Public surfaces resolve covers per render; drop their cached HTML too.
  revalidatePath("/requests");
}

/**
 * Reserves the media row, then hands back the signed upload URL.
 *
 * The row is created as `uploading` *before* the browser can write a byte, so a failed or
 * abandoned upload is always represented by a record an admin can cancel — never by an
 * orphaned object in a bucket nothing indexes.
 */
export async function startLocationMediaUploadAction(
  input: z.input<typeof startSchema>,
): Promise<LocationMediaUploadStartResult> {
  try {
    const { adminClient, adminId } = await requireAdminSession();
    const { fileName, ...parsed } = startSchema.parse(input);
    const { path, signedUrl } = await getPresignedUploadUrl(
      LOCATION_MEDIA_BUCKET,
      fileName,
      parsed.mimeType,
      adminId,
    );
    const mediaId = await beginLocationMediaUpload(adminClient, {
      ...parsed,
      objectPath: path,
      createdBy: adminId,
    });
    revalidate(parsed.locationId);
    return { ok: true, mediaId, signedUrl };
  } catch (e) {
    return actionError(e, "Не удалось подготовить загрузку.");
  }
}

export async function confirmLocationMediaUploadAction(
  locationId: string,
  mediaId: string,
): Promise<LocationMediaActionResult> {
  try {
    const { adminClient } = await requireAdminSession();
    await confirmLocationMediaUpload(adminClient, z.string().uuid().parse(mediaId));
    revalidate(z.string().uuid().parse(locationId));
    return { ok: true };
  } catch (e) {
    return actionError(e, "Не удалось сохранить медиа.");
  }
}

export async function cancelLocationMediaUploadAction(
  locationId: string,
  mediaId: string,
): Promise<LocationMediaActionResult> {
  try {
    const { adminClient } = await requireAdminSession();
    await cancelLocationMediaUpload(adminClient, z.string().uuid().parse(mediaId));
    revalidate(z.string().uuid().parse(locationId));
    return { ok: true };
  } catch (e) {
    return actionError(e, "Не удалось отменить загрузку.");
  }
}

export async function updateLocationMediaAction(
  locationId: string,
  mediaId: string,
  patch: z.input<typeof patchSchema>,
): Promise<LocationMediaActionResult> {
  try {
    const { adminClient } = await requireAdminSession();
    const parsed = patchSchema.parse(patch);
    // A primary cover must be publicly resolvable, and the schema enforces it. Promoting
    // therefore implies publishing as a cover; the reverse — unpublishing, or demoting to
    // gallery — has to clear the flag in the same write, or the update just fails.
    if (parsed.isPrimary === true) {
      parsed.status = "published";
      parsed.role = "cover";
    } else if (parsed.status === "draft" || parsed.role === "gallery") {
      parsed.isPrimary = false;
    }
    await updateLocationMedia(adminClient, z.string().uuid().parse(mediaId), parsed);
    revalidate(z.string().uuid().parse(locationId));
    return { ok: true };
  } catch (e) {
    return actionError(e, "Не удалось обновить медиа.");
  }
}

export async function deleteLocationMediaAction(
  locationId: string,
  mediaId: string,
): Promise<LocationMediaActionResult> {
  try {
    const { adminClient } = await requireAdminSession();
    await deleteLocationMedia(adminClient, z.string().uuid().parse(mediaId));
    revalidate(z.string().uuid().parse(locationId));
    return { ok: true };
  } catch (e) {
    return actionError(e, "Не удалось удалить медиа.");
  }
}
