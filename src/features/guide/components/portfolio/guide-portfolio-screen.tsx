"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteGuideLocationPhoto,
  listGuideLocationPhotos,
  uploadPortfolioPhoto,
} from "@/data/guide-assets/supabase-client";
import type { GuideLocationPhotoRow, Uuid } from "@/lib/supabase/types";

interface GuidePortfolioScreenProps {
  guideId: string;
}

type PhotoWithPath = GuideLocationPhotoRow & { object_path: string };

function getPublicUrl(objectPath: string): string {
  return createSupabaseBrowserClient()
    .storage.from("guide-media")
    .getPublicUrl(objectPath).data.publicUrl;
}

export function GuidePortfolioScreen({ guideId }: GuidePortfolioScreenProps) {
  const [photos, setPhotos] = useState<PhotoWithPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    listGuideLocationPhotos(guideId as Uuid)
      .then(setPhotos)
      .finally(() => setLoading(false));
  }, [guideId]);

  async function handleUpload(file: File | undefined) {
    if (!file || !locationName.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadPortfolioPhoto({
        guideId: guideId as Uuid,
        file,
        locationName: locationName.trim(),
        sortOrder: photos.length,
      });
      setPhotos((prev) => [...prev, result]);
      setLocationName("");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Не удалось загрузить фото. Попробуйте ещё раз."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: Uuid) {
    await deleteGuideLocationPhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Портфолио локаций</h1>

      <div className="mb-8 rounded-xl border border-border bg-surface-high p-5">
        <p className="mb-3 text-sm font-medium">Добавить локацию</p>
        <input
          type="text"
          placeholder="Название места"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <label
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity ${
            !locationName.trim() || uploading
              ? "cursor-not-allowed bg-primary opacity-50"
              : "cursor-pointer bg-primary hover:bg-primary/90"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading || !locationName.trim()}
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          {uploading ? "Загружается…" : "Выбрать фото"}
        </label>
        {!locationName.trim() && !uploading && (
          <p className="mt-2 text-xs text-muted-foreground">
            Введите название места, чтобы загрузить фото
          </p>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-destructive">{uploadError}</p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Фотографий пока нет. Добавьте первую локацию.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl">
              <img
                src={getPublicUrl(photo.object_path)}
                alt={photo.location_name}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
                <p className="text-xs font-medium text-white">{photo.location_name}</p>
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                aria-label="Удалить"
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
