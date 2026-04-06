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
    <section className="rounded-glass border border-glass-border bg-glass p-[clamp(1.25rem,3vw,1.75rem)] shadow-glass backdrop-blur-[20px]">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="flex items-start justify-between gap-4 max-md:flex-col max-md:items-stretch">
        <div>
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Фото тура
          </p>
          <h2 className="flex flex-wrap items-center gap-2 font-sans text-base font-semibold text-foreground">
            Добавить фото
          </h2>
          <p className="text-[0.9375rem] leading-[1.65] text-muted-foreground">
            Первое фото станет обложкой. Можно загрузить несколько изображений по
            одному.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSelectFile}
          disabled={!listingId}
        >
          <ImagePlus size={16} />
          Выбрать фото
        </Button>
      </div>

      {!listingId ? (
        <div className="flex items-start gap-3 rounded-[1rem] bg-surface-low/[0.82] px-4 py-3.5 text-muted-foreground">
          <AlertCircle size={18} />
          <span>Сначала сохраните тур, чтобы привязать фотографии.</span>
        </div>
      ) : null}

      <button
        type="button"
        className="grid min-h-[13rem] w-full place-items-center gap-3 rounded-[calc(var(--card-radius)-2px)] border-2 border-dashed border-outline-variant bg-surface-high/[0.78] p-4 transition-[transform,border-color,background] duration-150 hover:-translate-y-0.5 hover:border-primary disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none"
        onClick={handleSelectFile}
        disabled={!listingId}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {progress !== null ? (
            <LoaderCircle size={24} className="animate-spin" />
          ) : (
            <ImagePlus size={24} />
          )}
        </span>
        <span className="text-center text-sm text-muted-foreground">
          {progress !== null ? `Загрузка: ${progress}%` : "Нажмите, чтобы выбрать фотографию"}
        </span>
      </button>

      {error ? (
        <div className="flex items-start gap-3 rounded-[1rem] bg-destructive/10 px-4 py-3.5 text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {photos.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-card bg-surface-high shadow-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.publicUrl}
                alt={photo.isCover ? "Обложка тура" : "Фотография тура"}
                className="block aspect-[4/3] w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-[0.8125rem] text-muted-foreground">
                <span
                  className={
                    photo.isCover
                      ? "inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3.5 py-1.5 text-xs font-semibold text-success"
                      : "inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3.5 py-1.5 text-xs font-semibold text-muted-foreground"
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
