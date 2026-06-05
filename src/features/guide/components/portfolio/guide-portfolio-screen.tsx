"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { kopecksToRub } from "@/data/money";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteGuideLocationPhoto,
  listGuideLocationPhotos,
  uploadPortfolioPhoto,
} from "@/data/guide-assets/supabase-client";
import {
  createGuideTemplate,
  deleteGuideTemplate,
  listGuideTemplates,
  uploadTemplatePhoto,
  updateGuideTemplate,
} from "@/data/guide-templates/supabase-client";
import type { GuideLocationPhotoRow, GuideTemplateRow, Uuid } from "@/lib/supabase/types";

interface GuidePortfolioScreenProps {
  guideId: string;
}

type PhotoWithPath = GuideLocationPhotoRow & { object_path: string };
type PhotoWithUrl = PhotoWithPath & { publicUrl: string };

const MAX_PHOTOS = 30;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = ALLOWED_MIME.join(",");
const TEMPLATE_FIELD_CLASS =
  "mt-1.5 min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm outline-none focus:border-primary";

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
  const [templates, setTemplates] = useState<GuideTemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GuideTemplateRow | null>(null);
  const [tplTitle, setTplTitle] = useState("");
  const [tplDescription, setTplDescription] = useState("");
  const [tplDuration, setTplDuration] = useState("");
  const [tplPriceRub, setTplPriceRub] = useState("");
  const [tplStatus, setTplStatus] = useState<"draft" | "published">("draft");
  const [tplMeetingPoint, setTplMeetingPoint] = useState("");
  const [tplMaxParticipants, setTplMaxParticipants] = useState("");
  const [tplPhotos, setTplPhotos] = useState<string[]>([]);
  const [tplPhotoUploading, setTplPhotoUploading] = useState(false);
  const [tplEditingId, setTplEditingId] = useState<string | null>(null);
  const [tplSaving, setTplSaving] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
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

        const [rows, templateRows] = await Promise.all([
          listGuideLocationPhotos(guideId),
          listGuideTemplates(guideId),
        ]);
        if (cancelled) return;
        setPhotos(
          rows.map((r) => ({ ...r, publicUrl: buildPublicUrl(supabase, r.object_path) })),
        );
        setTemplates(templateRows);
      } catch (err) {
        if (cancelled) return;
        console.error("[portfolio] list failed", err);
        setLoadError("Не удалось загрузить фото. Обновите страницу.");
      } finally {
        if (!cancelled) setLoading(false);
        if (!cancelled) setTemplatesLoading(false);
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function openCreateSheet() {
    setEditingTemplate(null);
    setTplTitle("");
    setTplDescription("");
    setTplDuration("");
    setTplPriceRub("");
    setTplStatus("draft");
    setTplMeetingPoint("");
    setTplMaxParticipants("");
    setTplPhotos([]);
    setTplEditingId(null);
    setTplError(null);
    setSheetOpen(true);
  }

  function openEditSheet(template: GuideTemplateRow) {
    setEditingTemplate(template);
    setTplTitle(template.title);
    setTplDescription(template.description ?? "");
    setTplDuration(template.duration_text ?? "");
    setTplPriceRub(
      template.price_from_kopecks != null
        ? String(kopecksToRub(template.price_from_kopecks))
        : "",
    );
    setTplStatus(template.status);
    setTplMeetingPoint(template.meeting_point ?? "");
    setTplMaxParticipants(
      template.max_participants != null ? String(template.max_participants) : "",
    );
    setTplPhotos(template.photo_urls ?? []);
    setTplEditingId(template.id);
    setTplError(null);
    setSheetOpen(true);
  }

  async function handleSaveTemplate() {
    if (!tplTitle.trim()) {
      setTplError("Название обязательно.");
      return;
    }

    const priceFromRub = tplPriceRub.trim() ? Number(tplPriceRub) : null;
    if (priceFromRub != null && (!Number.isFinite(priceFromRub) || priceFromRub < 0)) {
      setTplError("Укажите корректную цену.");
      return;
    }
    const maxParticipants = tplMaxParticipants.trim() ? Number(tplMaxParticipants) : null;
    if (
      maxParticipants != null &&
      (!Number.isInteger(maxParticipants) || maxParticipants < 1 || maxParticipants > 500)
    ) {
      setTplError("Укажите корректное число участников.");
      return;
    }
    if (tplStatus === "published" && tplPhotos.length === 0) {
      setTplError("Добавьте минимум одно фото для публикации.");
      return;
    }

    setTplSaving(true);
    setTplError(null);
    try {
      if (editingTemplate) {
        const updated = await updateGuideTemplate(editingTemplate.id, {
          title: tplTitle.trim(),
          description: tplDescription.trim() || null,
          durationText: tplDuration.trim() || null,
          priceFromRub,
          meetingPoint: tplMeetingPoint.trim() || null,
          maxParticipants,
          photoUrls: tplPhotos,
          status: tplStatus,
        });
        setTemplates((prev) =>
          prev.map((template) => (template.id === updated.id ? updated : template)),
        );
      } else {
        const created = await createGuideTemplate({
          title: tplTitle.trim(),
          description: tplDescription.trim() || null,
          durationText: tplDuration.trim() || null,
          priceFromRub,
          meetingPoint: tplMeetingPoint.trim() || null,
          maxParticipants,
          photoUrls: tplPhotos,
          status: tplStatus,
        });
        setTemplates((prev) => [...prev, created]);
      }
      setSheetOpen(false);
    } catch (err) {
      setTplError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setTplSaving(false);
    }
  }

  async function handleDeleteTemplate(template: GuideTemplateRow) {
    if (!window.confirm(`Удалить шаблон «${template.title}»?`)) return;
    setDeletingTemplateId(template.id);
    try {
      await deleteGuideTemplate(template.id);
      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Не удалось удалить шаблон.");
    } finally {
      setDeletingTemplateId(null);
    }
  }

  async function handleTemplatePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file || !authenticatedGuideId) return;
    const validationError = validateFile(file);
    if (validationError) {
      setTplError(validationError);
      e.currentTarget.value = "";
      return;
    }

    setTplPhotoUploading(true);
    setTplError(null);
    try {
      const url = await uploadTemplatePhoto({ guideId: authenticatedGuideId, file });
      setTplPhotos((prev) => [...prev, url]);
    } catch {
      setTplError("Не удалось загрузить фото");
    } finally {
      setTplPhotoUploading(false);
      e.currentTarget.value = "";
    }
  }

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

      <h1 className="text-xl font-semibold">Портфолио</h1>

      <Tabs defaultValue="photos" className="mt-6">
        <TabsList>
          <TabsTrigger value="photos">Фото</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          <div className="mb-8 rounded-xl border border-border bg-surface-high p-5">
            <p className="mb-3 text-sm font-medium">Добавить локацию</p>
            <input
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
                Введите название места, чтобы загрузить фото
              </p>
            )}
            {reachedLimit && !uploading && (
              <p className="mt-2 text-xs text-muted-foreground">
                Достигнут предел в {MAX_PHOTOS} фото. Удалите старое, чтобы добавить новое.
              </p>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-destructive">{uploadError}</p>
            )}
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
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl bg-surface-high"
                />
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
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <button
            type="button"
            onClick={openCreateSheet}
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-high px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            + Новый шаблон
          </button>

          {templatesLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Загрузка шаблонов">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-high" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Шаблонов пока нет. Создайте первый.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-high px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {template.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium ${
                          template.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {template.status === "published" ? "Опубл." : "Черновик"}
                      </span>
                      {template.photo_urls.length > 0 && (
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          {template.photo_urls.length} фото
                        </span>
                      )}
                    </div>
                    {template.duration_text && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {template.duration_text}
                      </p>
                    )}
                    {template.meeting_point && (
                      <span className="block text-xs text-muted-foreground">
                        {template.meeting_point}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditSheet(template)}
                      className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      disabled={deletingTemplateId === template.id}
                      className="rounded-lg px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {deletingTemplateId === template.id ? "…" : "Удалить"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{tplEditingId ? "Изменить шаблон" : "Новый шаблон"}</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4 px-4">
            <div>
              <Label htmlFor="tpl-title">
                Название <span className="text-destructive">*</span>
              </Label>
              <input
                id="tpl-title"
                type="text"
                value={tplTitle}
                maxLength={120}
                onChange={(e) => setTplTitle(e.target.value)}
                placeholder="Например: Тбилиси за один день"
                className={TEMPLATE_FIELD_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="tpl-description">Текст отклика</Label>
              <Textarea
                id="tpl-description"
                value={tplDescription}
                maxLength={2000}
                onChange={(e) => setTplDescription(e.target.value)}
                placeholder="Описание маршрута, программа, что входит…"
                className="mt-1.5 min-h-[120px]"
              />
            </div>
            <div>
              <Label htmlFor="tpl-duration">Длительность</Label>
              <input
                id="tpl-duration"
                type="text"
                value={tplDuration}
                maxLength={60}
                onChange={(e) => setTplDuration(e.target.value)}
                placeholder="Например: 6 часов"
                className={TEMPLATE_FIELD_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="tpl-price">Цена от (₽)</Label>
              <input
                id="tpl-price"
                type="number"
                value={tplPriceRub}
                min={0}
                onChange={(e) => setTplPriceRub(e.target.value)}
                placeholder="Оставьте пустым — обсудите в чате"
                className={TEMPLATE_FIELD_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="tpl-meeting-point">Место сбора</Label>
              <input
                id="tpl-meeting-point"
                type="text"
                value={tplMeetingPoint}
                maxLength={200}
                onChange={(e) => setTplMeetingPoint(e.target.value)}
                placeholder="Например: метро Арбатская, выход 2"
                className={TEMPLATE_FIELD_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="tpl-max-participants">Макс. участников</Label>
              <input
                id="tpl-max-participants"
                type="number"
                min={1}
                max={500}
                value={tplMaxParticipants}
                onChange={(e) => setTplMaxParticipants(e.target.value)}
                placeholder="10"
                className={TEMPLATE_FIELD_CLASS}
              />
            </div>
            <div>
              <Label>Фото маршрута</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {tplPhotos.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-border"
                  >
                    <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setTplPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                      aria-label="Удалить фото маршрута"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {tplPhotos.length < 10 && (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted">
                    {tplPhotoUploading ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <span className="text-xl">+</span>
                    )}
                    <input
                      type="file"
                      accept={ACCEPT_ATTR}
                      className="sr-only"
                      onChange={handleTemplatePhotoUpload}
                      disabled={tplPhotoUploading}
                    />
                  </label>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Фото маршрута (не из профиля). Мин. 1 для публикации.
              </p>
            </div>
            <div>
              <Label>Статус</Label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTplStatus("draft")}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    tplStatus === "draft"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Черновик
                </button>
                <button
                  type="button"
                  onClick={() => setTplStatus("published")}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    tplStatus === "published"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Опубликовано
                </button>
              </div>
            </div>
            {tplError && <p className="text-xs text-destructive">{tplError}</p>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 px-4 pb-4">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="rounded-xl border border-border bg-surface-high px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={tplSaving}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {tplSaving ? "Сохраняется…" : "Сохранить"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
