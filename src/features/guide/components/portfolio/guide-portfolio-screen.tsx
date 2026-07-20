"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteGuideLocationPhoto,
  listGuideLocationPhotos,
  uploadPortfolioPhoto,
} from "@/lib/supabase/guide-assets";
import { CoachCallout } from "@/features/guide/components/excursions/photobank-coach";
import type { GuideLocationPhotoRow, Uuid } from "@/lib/supabase/types";

interface GuidePortfolioScreenProps {
  guideId: string;
}

type PhotoWithPath = GuideLocationPhotoRow & { object_path: string };
type PhotoWithUrl = PhotoWithPath & { publicUrl: string };

const MAX_PHOTOS = 30;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = ALLOWED_MIME.join(",");

function buildPublicUrl(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  objectPath: string,
): string {
  return supabase.storage.from("guide-portfolio").getPublicUrl(objectPath).data.publicUrl;
}

export function GuidePortfolioScreen({ guideId: _guideId }: GuidePortfolioScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authenticatedGuideId, setAuthenticatedGuideId] = useState<Uuid | null>(null);
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const guideId = user.id as Uuid;
        if (!cancelled) setAuthenticatedGuideId(guideId);

        const rows = await listGuideLocationPhotos(guideId);
        if (cancelled) return;
        setPhotos(
          rows.map((r) => ({ ...r, publicUrl: buildPublicUrl(supabase, r.object_path) })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("[portfolio] list failed", err);
        setLoadError("Не удалось загрузить фото. Обновите страницу.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) {
      return "Подходят только JPEG, PNG или WebP.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return "Файл больше 10 МБ. Сожмите его и попробуйте ещё раз.";
    }
    return null;
  }

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(file: File | undefined) {
    if (!file || !locationName.trim() || !authenticatedGuideId) return;
    if (photos.length >= MAX_PHOTOS) {
      setUploadError(`Максимум ${MAX_PHOTOS} фото. Удалите старое, чтобы добавить новое.`);
      resetFileInput();
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      resetFileInput();
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadPortfolioPhoto({
        guideId: authenticatedGuideId,
        file,
        locationName: locationName.trim(),
        sortOrder: photos.length,
      });
      setPhotos((prev) => [
        ...prev,
        { ...result, publicUrl: buildPublicUrl(supabase, result.object_path) },
      ]);
      setLocationName("");
    } catch (err) {
      console.error("[portfolio] upload failed", err);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить фото. Попробуйте ещё раз.",
      );
    } finally {
      setUploading(false);
      resetFileInput();
    }
  }

  async function handleDelete(id: Uuid, locationLabel: string) {
    if (!window.confirm(`Удалить фото «${locationLabel}»?`)) return;
    setDeletingId(id);
    try {
      await deleteGuideLocationPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setBrokenIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("[portfolio] delete failed", err);
      window.alert("Не удалось удалить фото. Попробуйте ещё раз.");
    } finally {
      setDeletingId(null);
    }
  }

  const reachedLimit = photos.length >= MAX_PHOTOS;
  const disabled = !locationName.trim() || !authenticatedGuideId || uploading || reachedLimit;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/guide"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← В кабинет
        </Link>
      </div>

      <h1 className="text-xl font-semibold">Фотобанк</h1>

      <div className="mt-4">
        <CoachCallout storageKey="pb-coach-inside">
          Фотобанк нужен для создания готовых экскурсий, а также для кастомизированных
          откликов на запросы туристов.
        </CoachCallout>
      </div>

      <div className="mt-6">
        <div className="mb-8 rounded-xl border border-border bg-surface-high p-5">
          <p className="mb-3 text-sm font-medium">Добавить локацию</p>
          <label htmlFor="photo-location" className="mb-1 block text-sm font-medium">
            Локация
          </label>
          <input
            id="photo-location"
            type="text"
            placeholder="Название места"
            value={locationName}
            maxLength={80}
            onChange={(e) => setLocationName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <label
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity ${
              disabled
                ? "cursor-not-allowed bg-primary opacity-50"
                : "cursor-pointer bg-primary hover:bg-primary/90"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="sr-only"
              disabled={disabled}
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            {uploading ? "Загружается…" : "Выбрать фото"}
          </label>
          {!locationName.trim() && !uploading && (
            <p className="mt-2 text-xs text-muted-foreground">
              Введите локацию, чтобы загрузить фото
            </p>
          )}
          {reachedLimit && !uploading && (
            <p className="mt-2 text-xs text-muted-foreground">
              Достигнут предел в {MAX_PHOTOS} фото. Удалите старое, чтобы добавить новое.
            </p>
          )}
          {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            JPEG, PNG или WebP до 10 МБ. {photos.length}/{MAX_PHOTOS} фото
          </p>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            aria-busy="true"
            aria-label="Загрузка фотографий"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface-high" />
            ))}
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Фотографий пока нет. Добавьте первую локацию.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => {
              const broken = brokenIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-surface-high"
                >
                  {broken ? (
                    <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      Фото недоступно
                    </div>
                  ) : (
                    <Image
                      src={photo.publicUrl}
                      alt={photo.location_name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                      className="object-cover"
                      onError={() =>
                        setBrokenIds((prev) => {
                          if (prev.has(photo.id)) return prev;
                          const next = new Set(prev);
                          next.add(photo.id);
                          return next;
                        })
                      }
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent px-2 py-2">
                    <p className="text-xs font-medium text-primary-foreground">
                      {photo.location_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id, photo.location_name)}
                    aria-label={`Удалить фото ${photo.location_name}`}
                    disabled={deletingId === photo.id}
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-foreground/50 text-primary-foreground opacity-0 transition-opacity hover:bg-foreground/70 focus:opacity-100 disabled:opacity-50 group-hover:opacity-100"
                  >
                    {deletingId === photo.id ? "…" : "✕"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
