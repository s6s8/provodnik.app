"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmUpload, getPresignedUploadUrl } from "@/lib/storage/upload";
import { guideVerificationDocumentTypes } from "@/features/guide/components/verification/verification-types";
import type { GuideDocumentRow, StorageAssetRow } from "@/lib/supabase/types";

const guideDocumentTypeSchema = z.enum(guideVerificationDocumentTypes);

const uploadUrlSchema = z.object({
  bucket: z.literal("guide-documents"),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
});

const confirmGuideAssetSchema = z.object({
  bucketId: z.literal("guide-documents"),
  objectPath: z.string().trim().min(1).max(512),
  assetKind: z.literal("guide-document"),
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().positive(),
});

const confirmDocumentSchema = z.object({
  assetId: z.string().uuid(),
  documentType: guideDocumentTypeSchema,
});

async function getCurrentGuideId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("Не авторизован.");
  }

  return session.user.id;
}

async function getOwnedAsset(assetId: string, ownerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("storage_assets")
    .select(
      "id, owner_id, bucket_id, object_path, asset_kind, mime_type, byte_size, created_at",
    )
    .eq("id", assetId)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Загруженный файл не найден.");
  }

  return data as StorageAssetRow;
}

export async function getUploadUrl(
  bucket: string,
  fileName: string,
  mimeType: string,
) {
  const input = uploadUrlSchema.parse({ bucket, fileName, mimeType });
  const guideId = await getCurrentGuideId();

  return getPresignedUploadUrl(
    input.bucket,
    input.fileName,
    input.mimeType,
    guideId,
  );
}

export async function confirmGuideAssetUpload(data: {
  bucketId: string;
  objectPath: string;
  assetKind: "guide-document";
  mimeType: string;
  byteSize: number;
}) {
  const input = confirmGuideAssetSchema.parse(data);
  const guideId = await getCurrentGuideId();
  const asset = await confirmUpload({
    ownerId: guideId,
    bucketId: input.bucketId,
    objectPath: input.objectPath,
    assetKind: input.assetKind,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  return {
    id: asset.id,
    objectPath: asset.object_path,
    mimeType: asset.mime_type,
    byteSize: asset.byte_size,
  };
}

export async function confirmDocumentUpload(
  assetId: string,
  documentType: string,
) {
  const input = confirmDocumentSchema.parse({ assetId, documentType });
  const guideId = await getCurrentGuideId();
  const supabase = await createSupabaseServerClient();
  const asset = await getOwnedAsset(input.assetId, guideId);

  const { data: existing } = await supabase
    .from("guide_documents")
    .select("id")
    .eq("guide_id", guideId)
    .eq("document_type", input.documentType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let documentRow: GuideDocumentRow | null = null;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("guide_documents")
      .update({
        asset_id: asset.id,
        status: "draft",
        admin_note: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("id", existing.id)
      .select(
        "id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at",
      )
      .single();

    if (error || !data) {
      throw error ?? new Error("Не удалось привязать документ к профилю гида.");
    }

    documentRow = data as GuideDocumentRow;
  } else {
    const { data, error } = await supabase
      .from("guide_documents")
      .insert({
        guide_id: guideId,
        asset_id: asset.id,
        document_type: input.documentType,
        status: "draft",
      })
      .select(
        "id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at",
      )
      .single();

    if (error || !data) {
      throw error ?? new Error("Не удалось сохранить документ для верификации.");
    }

    documentRow = data as GuideDocumentRow;
  }

  revalidatePath("/guide/verification");

  return {
    id: documentRow.id,
    documentType: documentRow.document_type,
    status: documentRow.status,
    assetId: documentRow.asset_id,
    objectPath: asset.object_path,
  };
}

export async function submitForVerification() {
  const guideId = await getCurrentGuideId();
  const supabase = await createSupabaseServerClient();

  const { data: requiredDocuments, error: documentsError } = await supabase
    .from("guide_documents")
    .select("document_type")
    .eq("guide_id", guideId)
    .in("document_type", ["passport", "selfie"]);

  if (documentsError) {
    throw documentsError;
  }

  const uploadedTypes = new Set(
    (requiredDocuments ?? []).map((item) => item.document_type),
  );

  if (!uploadedTypes.has("passport") || !uploadedTypes.has("selfie")) {
    throw new Error("Загрузите паспорт и селфи с документом перед отправкой.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("guide_profiles")
    .select("user_id")
    .eq("user_id", guideId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error("Сначала заполните профиль гида.");
  }

  const { error: guideError } = await supabase
    .from("guide_profiles")
    .update({ verification_status: "submitted" })
    .eq("user_id", guideId);

  if (guideError) {
    throw guideError;
  }

  const { error: documentsUpdateError } = await supabase
    .from("guide_documents")
    .update({ status: "submitted" })
    .eq("guide_id", guideId);

  if (documentsUpdateError) {
    throw documentsUpdateError;
  }

  revalidatePath("/guide/verification");

  return { status: "submitted" as const };
}
