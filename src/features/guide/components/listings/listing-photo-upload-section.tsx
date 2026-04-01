"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getStorageBucketConfig } from "@/lib/storage/buckets";
import { uploadFileToSignedUrl } from "@/lib/storage/client-upload";

export type ListingUploadedPhoto = {
  id: string;
  objectPath: string;
  publicUrl: string;
  isCover: boolean;
};

type ListingPhotoUploadSectionProps = {
  listingId: string | null;
  initialPhotos?: ListingUploadedPhoto[];
  actions: {
    getUploadUrl: (
      bucket: string,
      fileName: string,
      mimeType: string,
    ) => Promise<{ path: string; token: string; signedUrl: string }>;
    confirmUpload: (data: {
      listingId: string;
      objectPath: string;
      mimeType: string;
      byteSize: number;
    }) => Promise<ListingUploadedPhoto>;
  };
};

const listingMediaBucket = getStorageBucketConfig("listing-media");

export function ListingPhotoUploadSection({
  listingId,
  initialPhotos = [],
  actions,
}: ListingPhotoUploadSectionProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = React.useState<ListingUploadedPhoto[]>(initialPhotos);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelectFile = React.useCallback(() => {
    if (!listingId) {
      return;
    }

    inputRef.current?.click();
  }, [listingId]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || !listingId) {
        return;
      }

      if (!listingMediaBucket.allowedMimeTypes.includes(file.type as never)) {
        setError("Для фото подходят только JPG, PNG и WEBP.");
        return;
      }

      if (file.size > listingMediaBucket.maxBytes) {
        setError("Файл превышает лимит 5 МБ.");
        return;
      }

      setError(null);
      setProgress(0);

      try {
        const uploadUrl = await actions.getUploadUrl(
          "listing-media",
          file.name,
          file.type,
        );

        await uploadFileToSignedUrl({
          signedUrl: uploadUrl.signedUrl,
          file,
          onProgress: setProgress,
        });

        const photo = await actions.confirmUpload({
          listingId,
          objectPath: uploadUrl.path,
          mimeType: file.type,
          byteSize: file.size,
        });

        setPhotos((current) => [...current, photo]);
        setProgress(null);
      } catch (uploadError) {
        setProgress(null);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Не удалось загрузить фото.",
        );
      }
    },
    [actions, listingId],
  );

  return (
    <section className="upload-photo-section glass-panel">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="upload-photo-section__header">
        <div>
          <p className="sec-label">Фото тура</p>
          <h2 className="upload-photo-section__title">Добавить фото</h2>
          <p className="upload-copy">
            Первое фото станет обложкой. Можно загрузить несколько изображений по
            одному.
          </p>
        </div>
        <Button
          type="button"
          className="btn-primary"
          onClick={handleSelectFile}
          disabled={!listingId}
        >
          <ImagePlus size={16} />
          Выбрать фото
        </Button>
      </div>

      {!listingId ? (
        <div className="upload-alert">
          <AlertCircle size={18} />
          <span>Сначала сохраните тур, чтобы привязать фотографии.</span>
        </div>
      ) : null}

      <button
        type="button"
        className="upload-photo-dropzone"
        onClick={handleSelectFile}
        disabled={!listingId}
      >
        <span className="upload-card__preview-icon">
          {progress !== null ? (
            <LoaderCircle size={24} className="animate-spin" />
          ) : (
            <ImagePlus size={24} />
          )}
        </span>
        <span className="upload-card__dropzone-copy">
          {progress !== null ? `Загрузка: ${progress}%` : "Нажмите, чтобы выбрать фотографию"}
        </span>
      </button>

      {error ? (
        <div className="upload-alert upload-alert--danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {photos.length ? (
        <div className="upload-thumb-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="upload-thumb">
              <img
                src={photo.publicUrl}
                alt={photo.isCover ? "Обложка тура" : "Фотография тура"}
                className="upload-thumb__image"
              />
              <div className="upload-thumb__meta">
                <span
                  className={
                    photo.isCover
                      ? "upload-status-badge upload-status-badge--success"
                      : "upload-status-badge"
                  }
                >
                  {photo.isCover ? "Обложка" : "Галерея"}
                </span>
                <CheckCircle2 size={16} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
