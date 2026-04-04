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
import type { GuideVerificationStatusDb } from "@/lib/supabase/types";
import type {
  GuideVerificationDocumentType,
  UploadedGuideDocument,
} from "./verification-types";

type DocumentUploadCardProps = {
  label: string;
  required?: boolean;
  documentType: GuideVerificationDocumentType;
  initialDocument?: UploadedGuideDocument | null;
  onUploadComplete: (document: UploadedGuideDocument) => void;
  onRequestUploadUrl: (
    bucket: "guide-documents",
    fileName: string,
    mimeType: string,
  ) => Promise<{ path: string; token: string; signedUrl: string }>;
  onConfirmAsset: (data: {
    bucketId: "guide-documents";
    objectPath: string;
    assetKind: "guide-document";
    mimeType: string;
    byteSize: number;
  }) => Promise<{ id: string; objectPath: string }>;
  onLinkDocument: (
    assetId: string,
    documentType: GuideVerificationDocumentType,
  ) => Promise<{
    id: string;
    status: GuideVerificationStatusDb;
    assetId: string;
    objectPath: string;
  }>;
};

type UploadState = {
  progress: number;
  error: string | null;
  isUploading: boolean;
  previewUrl: string | null;
  uploaded: UploadedGuideDocument | null;
};

const guideDocumentBucket = getStorageBucketConfig("guide-documents");

function getDocumentFileName(document: UploadedGuideDocument | null) {
  if (!document) return null;
  return document.fileName || document.objectPath.split("/").at(-1) || null;
}

export function DocumentUploadCard({
  label,
  required = false,
  documentType,
  initialDocument = null,
  onUploadComplete,
  onRequestUploadUrl,
  onConfirmAsset,
  onLinkDocument,
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

  const handleSelectFile = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const uploadUrl = await onRequestUploadUrl(
          "guide-documents",
          file.name,
          file.type,
        );

        await uploadFileToSignedUrl({
          signedUrl: uploadUrl.signedUrl,
          file,
          onProgress: (progress) => {
            setState((current) => ({ ...current, progress }));
          },
        });

        const asset = await onConfirmAsset({
          bucketId: "guide-documents",
          objectPath: uploadUrl.path,
          assetKind: "guide-document",
          mimeType: file.type,
          byteSize: file.size,
        });

        const document = await onLinkDocument(asset.id, documentType);
        const uploadedDocument: UploadedGuideDocument = {
          assetId: document.assetId,
          documentType,
          objectPath: document.objectPath,
          fileName: file.name,
          status: document.status,
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
    [documentType, onConfirmAsset, onLinkDocument, onRequestUploadUrl, onUploadComplete],
  );

  const fileName = getDocumentFileName(state.uploaded);
  const hasImagePreview = Boolean(state.previewUrl);

  return (
    <article
      className={[
        "upload-card",
        state.uploaded ? "upload-card--uploaded" : "upload-card--empty",
        state.isUploading ? "upload-card--uploading" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="upload-card__header">
        <div>
          <h3 className="upload-card__title">
            {label}
            {required ? <span className="upload-card__required">Обязательно</span> : null}
          </h3>
          <p className="upload-card__hint">JPG, PNG, WEBP или PDF до 10 МБ.</p>
        </div>
        {state.uploaded ? (
          <span className="upload-card__check">
            <CheckCircle2 size={18} />
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="upload-card__dropzone"
        onClick={handleSelectFile}
        disabled={state.isUploading}
      >
        {hasImagePreview ? (
          <img
            src={state.previewUrl ?? ""}
            alt={label}
            className="upload-card__image-preview"
          />
        ) : state.uploaded?.fileName?.toLowerCase().endsWith(".pdf") ? (
          <span className="upload-card__preview-icon">
            <FileText size={24} />
          </span>
        ) : (
          <span className="upload-card__preview-icon">
            {state.isUploading ? (
              <LoaderCircle size={24} className="animate-spin" />
            ) : (
              <Upload size={24} />
            )}
          </span>
        )}

        <span className="upload-card__dropzone-copy">
          {state.isUploading
            ? `Загрузка: ${state.progress}%`
            : state.uploaded
              ? "Файл загружен. Нажмите, чтобы заменить."
              : "Нажмите, чтобы выбрать файл"}
        </span>
      </button>

      <div className="upload-card__footer">
        <div className="upload-card__file">
          {state.uploaded ? <ImageIcon size={16} /> : <FileText size={16} />}
          <span>{fileName ?? "Файл ещё не выбран"}</span>
        </div>
        {state.error ? <p className="upload-card__error">{state.error}</p> : null}
      </div>
    </article>
  );
}
