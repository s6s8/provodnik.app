"use server";

import { randomUUID } from "node:crypto";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StorageBucketId } from "@/lib/storage/buckets";
import { assertMimeTypeAllowed } from "@/lib/storage/upload";
import {
  AVATAR_MESSAGES,
  AdminRoleNotAllowedError,
  type AvatarUploadResult,
} from "@/app/(protected)/profile/avatar-errors";

const AVATAR_SIZE_ERROR = AVATAR_MESSAGES.SIZE_ERROR;
const AVATAR_MIME_ERROR = AVATAR_MESSAGES.MIME_ERROR;
const AVATAR_SUCCESS = AVATAR_MESSAGES.SUCCESS;
const AVATAR_GENERIC_ERROR = AVATAR_MESSAGES.GENERIC_ERROR;

function getAvatarFile(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    throw new Error("Avatar file is required. Use FormData key \"avatar\".");
  }

  return file;
}

function getAvatarExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Unsupported avatar MIME type.");
  }
}

function getAvatarBucket(role: "guide" | "traveler"): StorageBucketId {
  return role === "guide" ? "guide-avatars" : "traveler-avatars";
}

export async function uploadAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  try {
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

    const file = getAvatarFile(formData);

    if (file.size > 2_097_152) {
      return { ok: false, message: AVATAR_SIZE_ERROR };
    }

    const bucket = getAvatarBucket(auth.role);

    try {
      assertMimeTypeAllowed(bucket, file.type);
    } catch {
      return { ok: false, message: AVATAR_MIME_ERROR };
    }

    const path = `${auth.userId}/${randomUUID()}.${getAvatarExtension(file.type)}`;
    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    // .select() forces PostgREST to return the affected rows: without it a
    // 0-row UPDATE (RLS block, or auth user with no profiles row) resolves
    // error:null and the upload would report success while the avatar never
    // persists — the silent failure behind row #39.
    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", auth.userId)
      .select("id");

    if (profileError) {
      throw profileError;
    }

    if (!updated || updated.length === 0) {
      throw new Error(`Avatar update affected 0 rows for user ${auth.userId}`);
    }

    return { ok: true, message: AVATAR_SUCCESS };
  } catch (error) {
    if (error instanceof AdminRoleNotAllowedError) {
      throw error;
    }

    return { ok: false, message: AVATAR_GENERIC_ERROR };
  }
}
