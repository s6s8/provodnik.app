"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { getStorageBucketConfig } from "@/lib/storage/buckets";
import { uploadFileToSignedUrl } from "@/lib/storage/client-upload";
import {
  LOCATION_MEDIA_BUCKET,
  type LocationMediaRecord,
} from "@/lib/supabase/location-media";
import {
  cancelLocationMediaUploadAction,
  confirmLocationMediaUploadAction,
  deleteLocationMediaAction,
  startLocationMediaUploadAction,
  updateLocationMediaAction,
} from "@/app/(protected)/admin/locations/[locationId]/actions";
import { readImageDimensions } from "./read-image-dimensions";

const bucket = getStorageBucketConfig(LOCATION_MEDIA_BUCKET);

/** The server action owns the canonical mime union; mirror it instead of restating it. */
type LocationMediaMime = Parameters<typeof startLocationMediaUploadAction>[0]["mimeType"];

function formatBytes(byteSize: number) {
  return byteSize < 1024 * 1024
    ? `${Math.round(byteSize / 1024)} КБ`
    : `${(byteSize / (1024 * 1024)).toFixed(1)} МБ`;
}

function trimmedOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Same rules as the server action, run before a byte leaves the browser. */
export function validateLocationMediaFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!bucket.allowedMimeTypes.includes(file.type as never)) {
    return "Разрешены только JPG, PNG или WEBP.";
  }
  if (file.size > bucket.maxBytes) {
    return "Файл превышает лимит 5 МБ.";
  }
  return null;
}

export function LocationMediaConsole({
  locationId,
  locationName,
  media,
}: {
  locationId: string;
  locationName: string;
  media: LocationMediaRecord[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({
    altText: "",
    caption: "",
    source: "",
    role: "cover" as LocationMediaRecord["role"],
  });

  const primary = media.find((item) => item.isPrimary && item.status === "published");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const invalid = validateLocationMediaFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const dimensions = await readImageDimensions(file);
      // Reserve the row first: from here on, every outcome — success, failure, a closed
      // tab — is represented in the database rather than as a stray storage object.
      const upload = await startLocationMediaUploadAction({
        locationId,
        fileName: file.name,
        // Narrowed by validateLocationMediaFile above and re-validated server-side.
        mimeType: file.type as LocationMediaMime,
        byteSize: file.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        role: draft.role,
        altText: trimmedOrNull(draft.altText) ?? `${locationName} — обложка`,
        caption: trimmedOrNull(draft.caption),
        source: trimmedOrNull(draft.source),
      });
      if (!upload.ok) {
        setError(upload.error);
        return;
      }

      try {
        await uploadFileToSignedUrl({ signedUrl: upload.signedUrl, file });
      } catch (e) {
        await cancelLocationMediaUploadAction(locationId, upload.mediaId);
        throw e;
      }

      const confirmed = await confirmLocationMediaUploadAction(locationId, upload.mediaId);
      if (!confirmed.ok) {
        setError(confirmed.error);
        return;
      }
      setDraft({ altText: "", caption: "", source: "", role: "cover" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить файл.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  async function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border bg-card px-2.5 py-2 text-left">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Обложка локации — не общий баннер и не изображение главной страницы. Опубликованная
            главная обложка меняет только публичный список запросов и страницы отдельных запросов
            для этой локации; остальные поверхности сохраняют текущий вид.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Выберите «Обложка».</li>
            <li>Загрузите JPG, PNG или WebP до 5 МБ.</li>
            <li>Добавьте понятное описание (alt) — рекомендуем; подпись и источник / права необязательны.</li>
            <li>Опубликуйте изображение.</li>
            <li>Нажмите «Сделать главной».</li>
          </ol>
          <p>
            Рекомендуем горизонтальный формат 16:9, 1600×900: это рекомендация, не обязательное
            требование. «Галерея» не заменяет фирменный городской градиент — это делает только
            опубликованная главная «Обложка».
          </p>
        </div>
      </section>

      <div className="rounded-card border border-border bg-surface-high p-5">
        <h2 className="text-base font-semibold text-foreground">Загрузить изображение</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG, PNG или WEBP до 5 МБ. Описание и источник можно заполнить до загрузки — они
          сохранятся вместе с файлом.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="media-alt">Описание (alt)</Label>
            <Input
              id="media-alt"
              className="mt-1.5"
              maxLength={300}
              value={draft.altText}
              placeholder={`${locationName} — обложка`}
              onChange={(e) => setDraft((d) => ({ ...d, altText: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="media-caption">Подпись</Label>
            <Input
              id="media-caption"
              className="mt-1.5"
              maxLength={300}
              value={draft.caption}
              onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="media-source">Источник / права</Label>
            <Input
              id="media-source"
              className="mt-1.5"
              maxLength={300}
              value={draft.source}
              onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="media-role">Роль изображения</Label>
            <select
              id="media-role"
              className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              value={draft.role}
              onChange={(e) =>
                setDraft((d) => ({ ...d, role: e.target.value as "cover" | "gallery" }))
              }
            >
              <option value="cover">Обложка</option>
              <option value="gallery">Галерея</option>
            </select>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          aria-label="Файл изображения"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => void handleFileChange(e)}
        />
        <Button
          type="button"
          className="mt-4"
          loading={busy}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файл
        </Button>
        {error ? (
          <Alert role="alert" variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {primary ? null : (
        <Alert>
          <AlertDescription>
            Главная обложка не опубликована — на публичных страницах остаётся фирменный
            градиент.
          </AlertDescription>
        </Alert>
      )}

      {media.length === 0 ? (
        <EmptyState
          title="Медиа нет"
          description="Загрузите изображение локации, чтобы заменить фирменный градиент на публичных карточках запросов."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              locationId={locationId}
              busy={busy}
              onRun={run}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  locationId,
  busy,
  onRun,
}: {
  item: LocationMediaRecord;
  locationId: string;
  busy: boolean;
  onRun: (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => Promise<void>;
}) {
  const [fields, setFields] = React.useState({
    altText: item.altText ?? "",
    caption: item.caption ?? "",
    source: item.source ?? "",
    role: item.role,
  });
  // `cancelling` is an in-flight cancel that outlived its storage removal, so it locks the
  // same controls as `uploading`: no bytes are settled behind either.
  const uploading = item.status === "uploading" || item.status === "cancelling";
  const dirty =
    (item.altText ?? "") !== fields.altText ||
    (item.caption ?? "") !== fields.caption ||
    (item.source ?? "") !== fields.source ||
    item.role !== fields.role;

  return (
    <article className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:flex-row">
      {item.signedUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.signedUrl}
          alt={item.altText ?? ""}
          className="h-32 w-full shrink-0 rounded-step object-cover sm:w-48"
        />
      ) : (
        <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-step border border-dashed border-border text-xs text-muted-foreground sm:w-48">
          Файл не загружен
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.status === "published" ? "default" : "secondary"}>
            {item.status === "published"
              ? "Опубликовано"
              : item.status === "cancelling"
                ? "Отменяется"
                : uploading
                  ? "Загружается"
                  : "Черновик"}
          </Badge>
          <Badge variant="secondary">{item.role === "cover" ? "Обложка" : "Галерея"}</Badge>
          {item.isPrimary ? <Badge>Главная</Badge> : null}
          <span className="text-sm text-muted-foreground">
            {item.mimeType.replace("image/", "").toUpperCase()} · {formatBytes(item.byteSize)}
            {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={`alt-${item.id}`}>Описание (alt)</Label>
            <Textarea
              id={`alt-${item.id}`}
              className="mt-1.5"
              rows={2}
              maxLength={300}
              value={fields.altText}
              onChange={(e) => setFields((f) => ({ ...f, altText: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor={`caption-${item.id}`}>Подпись</Label>
            <Input
              id={`caption-${item.id}`}
              className="mt-1.5"
              maxLength={300}
              value={fields.caption}
              onChange={(e) => setFields((f) => ({ ...f, caption: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor={`source-${item.id}`}>Источник / права</Label>
            <Input
              id={`source-${item.id}`}
              className="mt-1.5"
              maxLength={300}
              value={fields.source}
              onChange={(e) => setFields((f) => ({ ...f, source: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor={`role-${item.id}`}>Роль</Label>
            <select
              id={`role-${item.id}`}
              className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              value={fields.role}
              disabled={item.isPrimary || uploading}
              onChange={(e) =>
                setFields((f) => ({ ...f, role: e.target.value as "cover" | "gallery" }))
              }
            >
              <option value="cover">Обложка</option>
              <option value="gallery">Галерея</option>
            </select>
            {item.isPrimary ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Главная обложка всегда опубликована и имеет роль «Обложка».
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {uploading ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void onRun(() => cancelLocationMediaUploadAction(locationId, item.id))
              }
            >
              Отменить загрузку
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={busy || uploading || !dirty}
            onClick={() =>
              void onRun(() =>
                updateLocationMediaAction(locationId, item.id, {
                  altText: trimmedOrNull(fields.altText),
                  caption: trimmedOrNull(fields.caption),
                  source: trimmedOrNull(fields.source),
                  role: fields.role,
                }),
              )
            }
          >
            Сохранить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || uploading}
            onClick={() =>
              void onRun(() =>
                updateLocationMediaAction(locationId, item.id, {
                  status: item.status === "published" ? "draft" : "published",
                }),
              )
            }
          >
            {item.status === "published" ? "Снять с публикации" : "Опубликовать"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || uploading || item.isPrimary}
            onClick={() =>
              void onRun(() =>
                updateLocationMediaAction(locationId, item.id, { isPrimary: true }),
              )
            }
          >
            Сделать главной
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || uploading}
            onClick={() => void onRun(() => deleteLocationMediaAction(locationId, item.id))}
          >
            Удалить
          </Button>
        </div>
      </div>
    </article>
  );
}
