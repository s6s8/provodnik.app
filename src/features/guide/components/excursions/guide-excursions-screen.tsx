"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { kopecksToRub, rubToKopecks } from "@/data/money";
import {
  createGuideTemplate,
  deleteGuideTemplate,
  listGuideTemplates,
  uploadTemplatePhoto,
  updateGuideTemplate,
} from "@/data/guide-templates/supabase-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";

interface GuideExcursionsScreenProps {
  guideId: string;
}

const MAX_PHOTOS = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = ALLOWED_MIME.join(",");
const FIELD_CLASS =
  "mt-1.5 min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm outline-none focus:border-primary";

export function GuideExcursionsScreen({ guideId: _guideId }: GuideExcursionsScreenProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authenticatedGuideId, setAuthenticatedGuideId] = useState<Uuid | null>(null);
  const [templates, setTemplates] = useState<GuideTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    async function loadExcursions() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const guideId = user.id as Uuid;
        if (!cancelled) setAuthenticatedGuideId(guideId);

        const rows = await listGuideTemplates(guideId);
        if (cancelled) return;
        setTemplates(rows);
      } catch (err) {
        if (cancelled) return;
        console.error("[guide-excursions] list failed", err);
        setLoadError("Не удалось загрузить экскурсии. Обновите страницу.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadExcursions();

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

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) {
      return "Подходят только JPEG, PNG или WebP.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return "Файл больше 10 МБ. Сожмите его и попробуйте ещё раз.";
    }
    return null;
  }

  function parsePriceRub(): number | null {
    const rawPrice = tplPriceRub.trim();
    const priceFromRub = rawPrice ? Number(rawPrice) : Number.NaN;
    if (!Number.isFinite(priceFromRub) || priceFromRub <= 0) {
      setTplError("Укажите корректную положительную цену.");
      return null;
    }

    return kopecksToRub(rubToKopecks(priceFromRub));
  }

  async function handleSaveTemplate() {
    if (!tplTitle.trim()) {
      setTplError("Название обязательно.");
      return;
    }

    const priceFromRub = parsePriceRub();
    if (priceFromRub == null) return;

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
    if (!window.confirm(`Удалить экскурсию «${template.title}»?`)) return;
    setDeletingTemplateId(template.id);
    try {
      await deleteGuideTemplate(template.id);
      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Не удалось удалить экскурсию.");
    } finally {
      setDeletingTemplateId(null);
    }
  }

  async function handleTemplatePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file || !authenticatedGuideId) return;
    if (tplPhotos.length >= MAX_PHOTOS) {
      setTplError(`Максимум ${MAX_PHOTOS} фото маршрута.`);
      e.currentTarget.value = "";
      return;
    }
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

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Мои экскурсии</h1>
        <button
          type="button"
          onClick={openCreateSheet}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-high px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          + Добавить экскурсию
        </button>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Загрузка экскурсий">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-high" />
          ))}
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Экскурсий пока нет. Добавьте первую.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-high px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {template.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium ${
                      template.status === "published"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {template.status === "published" ? "Опубл." : "Черновик"}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                    {template.photo_urls.length} фото
                  </span>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{tplEditingId ? "Изменить экскурсию" : "Новая экскурсия"}</SheetTitle>
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
                className={FIELD_CLASS}
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
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <Label htmlFor="tpl-price">Цена от (₽)</Label>
              <input
                id="tpl-price"
                type="number"
                value={tplPriceRub}
                min={0.01}
                step={1}
                onChange={(e) => setTplPriceRub(e.target.value)}
                placeholder="Например: 5000"
                className={FIELD_CLASS}
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
                className={FIELD_CLASS}
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
                className={FIELD_CLASS}
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
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-foreground/60 text-xs text-primary-foreground"
                      aria-label="Удалить фото маршрута"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {tplPhotos.length < MAX_PHOTOS && (
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
                Фото маршрута. До {MAX_PHOTOS} фото, мин. 1 для публикации.
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
