"use server";

import { randomUUID } from "node:crypto";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StorageBucketId } from "@/lib/storage/buckets";
import { assertMimeTypeAllowed } from "@/lib/storage/upload";

const AVATAR_SIZE_ERROR = "Файл больше 2 МБ — выбери поменьше";
const AVATAR_MIME_ERROR = "Поддерживаются только JPG, PNG, WEBP";
const AVATAR_SUCCESS = "Аватар обновлён";
const AVATAR_GENERIC_ERROR = "Не удалось загрузить — попробуй ещё раз";

export class AdminRoleNotAllowedError extends Error {
  constructor() {
    super("Admins do not get avatars.");
    this.name = "AdminRoleNotAllowedError";
  }
}

export type AvatarUploadResult =
  | { ok: true; message: typeof AVATAR_SUCCESS }
  | {
      ok: false;
      message:
        | typeof AVATAR_SIZE_ERROR
        | typeof AVATAR_MIME_ERROR
        | typeof AVATAR_GENERIC_ERROR;
    };

function getAvatarFile(formData: FormData) {
  const file = formData.get("avatar") ?? formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Avatar file is required.");
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
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", auth.userId);

    if (profileError) {
      throw profileError;
    }

    return { ok: true, message: AVATAR_SUCCESS };
  } catch (error) {
    if (error instanceof AdminRoleNotAllowedError) {
      throw error;
    }

    return { ok: false, message: AVATAR_GENERIC_ERROR };
  }
}
