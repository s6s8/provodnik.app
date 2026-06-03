"use client";

import * as React from "react";
import {
  CheckCircle2,
  FileText,
  ImageIcon,
  LoaderCircle,
  Upload,
} from "lucide-react";

import { getStorageBucketConfig } from "@/lib/storage/buckets";
import { uploadFileToSignedUrl } from "@/lib/storage/client-upload";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideVerificationStatusDb } from "@/lib/supabase/types";
import type {
  VerificationAssetConfirmResult,
  VerificationDocumentLinkResult,
  VerificationUploadUrlResult,
} from "@/app/(protected)/guide/verification/actions-types";
import type {
  GuideVerificationDocumentType,
  UploadedGuideDocument,
} from "./verification-types";

type DocumentUploadCardProps = {
  label: string;
  required?: boolean;
  documentType: GuideVerificationDocumentType;
  verificationStatus?: GuideVerificationStatusDb | null;
  initialDocument?: UploadedGuideDocument | null;
  onUploadComplete: (document: UploadedGuideDocument) => void;
  onRequestUploadUrl: (
    bucket: "guide-documents",
    fileName: string,
    mimeType: string,
  ) => Promise<VerificationUploadUrlResult>;
  onConfirmAsset: (data: {
    bucketId: "guide-documents";
    objectPath: string;
    assetKind: "guide-document";
    mimeType: string;
    byteSize: number;
  }) => Promise<VerificationAssetConfirmResult>;
  onLinkDocument: (
    assetId: string,
    documentType: GuideVerificationDocumentType,
  ) => Promise<VerificationDocumentLinkResult>;
  onDeleteUploadedObject?: (data: {
    bucketId: "guide-documents";
    objectPath: string;
  }) => Promise<{ ok: true } | { error: string }>;
};

type UploadState = {
  progress: number;
  error: string | null;
  isUploading: boolean;
  previewUrl: string | null;
  uploaded: UploadedGuideDocument | null;
};

const guideDocumentBucket = getStorageBucketConfig("guide-documents");

async function deleteUploadedGuideDocument(objectPath: string) {
  const { error } = await createSupabaseBrowserClient()
    .storage
    .from("guide-documents")
    .remove([objectPath]);

  if (error) {
    throw error;
  }
}

function getDocumentFileName(document: UploadedGuideDocument | null) {
  if (!document) return null;
  return document.fileName || document.objectPath.split("/").at(-1) || null;
}

export function DocumentUploadCard({
  label,
  required = false,
  documentType,
  verificationStatus = null,
  initialDocument = null,
  onUploadComplete,
  onRequestUploadUrl,
  onConfirmAsset,
  onLinkDocument,
  onDeleteUploadedObject,
}: DocumentUploadCardProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [state, setState] = React.useState<UploadState>(() => ({
    progress: 0,
    error: null,
    isUploading: false,
    previewUrl: null,
    uploaded: initialDocument,
  }));

  React.useEffect(() => {
    return () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state.previewUrl]);

  const isLocked =
    verificationStatus === "submitted" || verificationStatus === "approved";

  const handleSelectFile = React.useCallback(() => {
    if (isLocked) {
      return;
    }
    inputRef.current?.click();
  }, [isLocked]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isLocked) {
        event.target.value = "";
        return;
      }

      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      if (!guideDocumentBucket.allowedMimeTypes.includes(file.type as never)) {
        setState((current) => ({
          ...current,
          error: "Разрешены только JPG, PNG, WEBP или PDF.",
        }));
        return;
      }

      if (file.size > guideDocumentBucket.maxBytes) {
        setState((current) => ({
          ...current,
          error: "Файл превышает лимит 10 МБ.",
        }));
        return;
      }

      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      setState((current) => ({
        ...current,
        error: null,
        isUploading: true,
        progress: 0,
        previewUrl,
      }));

      try {
        const uploadUrlResult = await onRequestUploadUrl(
          "guide-documents",
          file.name,
          file.type,
        );

        if ("error" in uploadUrlResult) {
          throw new Error(uploadUrlResult.error);
        }

        await uploadFileToSignedUrl({
          signedUrl: uploadUrlResult.signedUrl,
          file,
          onProgress: (progress) => {
            setState((current) => ({ ...current, progress }));
          },
        });

        const assetResult = await onConfirmAsset({
          bucketId: "guide-documents",
          objectPath: uploadUrlResult.path,
          assetKind: "guide-document",
          mimeType: file.type,
          byteSize: file.size,
        });

        if ("error" in assetResult) {
          throw new Error(assetResult.error);
        }

        const documentResult = await onLinkDocument(assetResult.id, documentType);

        if ("error" in documentResult) {
          if (onDeleteUploadedObject) {
            await onDeleteUploadedObject({
              bucketId: "guide-documents",
              objectPath: assetResult.objectPath,
            }).catch(() => null);
          } else {
            await deleteUploadedGuideDocument(assetResult.objectPath).catch(() => null);
          }
          throw new Error(documentResult.error);
        }

        const uploadedDocument: UploadedGuideDocument = {
          assetId: documentResult.assetId,
          documentType,
          objectPath: documentResult.objectPath,
          fileName: file.name,
          status: documentResult.status as GuideVerificationStatusDb,
        };

        setState((current) => ({
          ...current,
          uploaded: uploadedDocument,
          isUploading: false,
          progress: 100,
          error: null,
        }));
        onUploadComplete(uploadedDocument);
      } catch (error) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setState((current) => ({
          ...current,
          isUploading: false,
          progress: 0,
          previewUrl: null,
          error:
            error instanceof Error
              ? error.message
              : "Не удалось загрузить файл. Попробуйте ещё раз.",
        }));
      }
    },
    [
      documentType,
      isLocked,
      onConfirmAsset,
      onDeleteUploadedObject,
      onLinkDocument,
      onRequestUploadUrl,
      onUploadComplete,
    ],
  );

  const fileName = getDocumentFileName(state.uploaded);
  const hasImagePreview = Boolean(state.previewUrl);
  const isInteractionDisabled = state.isUploading || isLocked;

  return (
    <article className="grid min-h-full gap-4 rounded-glass border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-[20px]">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isLocked}
      />
      <div className="flex items-start justify-between gap-4 max-md:flex-col max-md:items-stretch">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 font-sans text-base font-semibold text-foreground">
            {label}
            {required ? (
              <span className="inline-flex rounded-full bg-primary/12 px-2 py-[0.2rem] text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary">
                Обязательно
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">
            JPG, PNG, WEBP или PDF до 10 МБ.
          </p>
        </div>
        {state.uploaded ? (
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 size={18} />
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="grid min-h-[13rem] w-full place-items-center gap-3 rounded-[calc(var(--card-radius)-2px)] border-2 border-dashed border-outline-variant bg-surface-high/[0.78] p-4 transition-[transform,border-color,background] duration-150 hover:-translate-y-0.5 hover:border-primary disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none"
        onClick={handleSelectFile}
        disabled={isInteractionDisabled}
      >
        {hasImagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.previewUrl ?? ""}
            alt={label}
            className="h-44 w-full rounded-[calc(var(--card-radius)-6px)] object-cover"
          />
        ) : state.uploaded?.fileName?.toLowerCase().endsWith(".pdf") ? (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText size={24} />
          </span>
        ) : (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {state.isUploading ? (
              <LoaderCircle size={24} className="animate-spin" />
            ) : (
              <Upload size={24} />
            )}
          </span>
        )}

        <span className="text-center text-sm text-muted-foreground">
          {state.isUploading
            ? `Загрузка: ${state.progress}%`
            : isLocked
              ? "Документы уже отправлены на проверку."
              : state.uploaded
              ? "Файл загружен. Нажмите, чтобы заменить."
              : "Нажмите, чтобы выбрать файл"}
        </span>
      </button>

      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
          {state.uploaded ? <ImageIcon size={16} /> : <FileText size={16} />}
          <span>{fileName ?? "Файл ещё не выбран"}</span>
        </div>
        {state.error ? (
          <p className="text-[0.8125rem] font-semibold text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
