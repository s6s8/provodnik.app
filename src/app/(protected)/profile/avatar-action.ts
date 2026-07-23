"use server";

import { z } from "zod";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StorageBucketId } from "@/lib/storage/buckets";
import { assertByteSizeAllowed, assertMimeTypeAllowed, getPresignedUploadUrl, getPublicUrl } from "@/lib/storage/upload";
import {
  AVATAR_MESSAGES,
  AdminRoleNotAllowedError,
  type AvatarUploadResult,
} from "@/app/(protected)/profile/avatar-errors";

const AVATAR_SIZE_ERROR = AVATAR_MESSAGES.SIZE_ERROR;
const AVATAR_MIME_ERROR = AVATAR_MESSAGES.MIME_ERROR;
const AVATAR_SUCCESS = AVATAR_MESSAGES.SUCCESS;
const AVATAR_GENERIC_ERROR = AVATAR_MESSAGES.GENERIC_ERROR;

const avatarUploadRequestSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z.number().int().positive().max(2_097_152),
});

const avatarUploadConfirmSchema = z.object({
  objectPath: z.string().trim().min(1).max(512),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z.number().int().positive().max(2_097_152),
});

export type AvatarUploadUrlResult =
  | { ok: true; signedUrl: string; objectPath: string; token: string }
  | { ok: false; message: typeof AVATAR_SIZE_ERROR | typeof AVATAR_MIME_ERROR | typeof AVATAR_GENERIC_ERROR };

function getAvatarBucket(role: "guide" | "traveler"): StorageBucketId {
  return role === "guide" ? "guide-avatars" : "traveler-avatars";
}

async function readAvatarActor() {
  const auth = await readAuthContextFromServer();

  if (auth.role === "admin") {
    throw new AdminRoleNotAllowedError();
  }

  if (
    !auth.isAuthenticated ||
    !auth.userId ||
    (auth.role !== "guide" && auth.role !== "traveler")
  ) {
    throw new Error("Avatar upload requires an authenticated guide or traveler.");
  }

  return {
    userId: auth.userId,
    role: auth.role,
    bucket: getAvatarBucket(auth.role),
  };
}

function avatarFileName(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "avatar.jpg";
    case "image/png":
      return "avatar.png";
    case "image/webp":
      return "avatar.webp";
    default:
      return "avatar.bin";
  }
}

export async function requestAvatarUploadUrlAction(input: {
  mimeType: string;
  byteSize: number;
}): Promise<AvatarUploadUrlResult> {
  try {
    const actor = await readAvatarActor();
    const parsed = avatarUploadRequestSchema.safeParse(input);
    if (!parsed.success) {
      if (input.byteSize > 2_097_152) {
        return { ok: false, message: AVATAR_SIZE_ERROR };
      }
      return { ok: false, message: AVATAR_MIME_ERROR };
    }

    try {
      assertMimeTypeAllowed(actor.bucket, parsed.data.mimeType);
      assertByteSizeAllowed(actor.bucket, parsed.data.byteSize);
    } catch {
      return { ok: false, message: parsed.data.byteSize > 2_097_152 ? AVATAR_SIZE_ERROR : AVATAR_MIME_ERROR };
    }

    const upload = await getPresignedUploadUrl(
      actor.bucket,
      avatarFileName(parsed.data.mimeType),
      parsed.data.mimeType,
      actor.userId,
    );

    return {
      ok: true,
      signedUrl: upload.signedUrl,
      objectPath: upload.path,
      token: upload.token,
    };
  } catch (error) {
    if (error instanceof AdminRoleNotAllowedError) {
      throw error;
    }

    return { ok: false, message: AVATAR_GENERIC_ERROR };
  }
}

export async function confirmAvatarUploadAction(input: {
  objectPath: string;
  mimeType: string;
  byteSize: number;
}): Promise<AvatarUploadResult> {
  try {
    const actor = await readAvatarActor();
    const parsed = avatarUploadConfirmSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: AVATAR_MIME_ERROR };
    }

    if (!parsed.data.objectPath.startsWith(`${actor.userId}/`)) {
      return { ok: false, message: AVATAR_GENERIC_ERROR };
    }

    try {
      assertMimeTypeAllowed(actor.bucket, parsed.data.mimeType);
      assertByteSizeAllowed(actor.bucket, parsed.data.byteSize);
    } catch {
      return { ok: false, message: AVATAR_MIME_ERROR };
    }

    const avatarUrl = getPublicUrl(actor.bucket, parsed.data.objectPath);
    const supabase = await createSupabaseServerClient();
    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", actor.userId)
      .select("id");

    if (profileError) {
      throw profileError;
    }

    if (!updated || updated.length === 0) {
      throw new Error(`Avatar update affected 0 rows for user ${actor.userId}`);
    }

    return { ok: true, message: AVATAR_SUCCESS };
  } catch (error) {
    if (error instanceof AdminRoleNotAllowedError) {
      throw error;
    }

    return { ok: false, message: AVATAR_GENERIC_ERROR };
  }
}
