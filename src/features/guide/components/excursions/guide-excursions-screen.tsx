"use client";

import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type SubmitErrorHandler } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { GuidePortfolioScreen } from "@/features/guide/components/portfolio/guide-portfolio-screen";
import { kopecksToRub } from "@/data/money";
import { THEMES } from "@/data/themes";
import { listGuideLocationPhotos } from "@/data/guide-assets/supabase-client";
import {
  createGuideTemplate,
  deleteGuideTemplate,
  listGuideTemplates,
  updateGuideTemplate,
} from "@/data/guide-templates/supabase-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";
import {
  defaultExcursionFormValues,
  excursionFormSchema,
  type ExcursionFormInput,
  type ExcursionFormValues,
} from "./excursion-form-schema";

const FIELD_CLASS =
  "mt-1.5 min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm outline-none focus:border-primary";

export function GuideExcursionsScreen() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authenticatedGuideId, setAuthenticatedGuideId] = useState<Uuid | null>(null);
  const [templates, setTemplates] = useState<GuideTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GuideTemplateRow | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<
    Array<{ id: string; location_name: string; photoUrl: string }>
  >([]);
  const [tplSaving, setTplSaving] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"excursions" | "photos">("excursions");
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, getValues, control } = useForm<
    ExcursionFormInput,
    unknown,
    ExcursionFormValues
  >({
    resolver: zodResolver(excursionFormSchema, undefined, { mode: "sync" }),
    defaultValues: defaultExcursionFormValues,
  });
  const tplStatus = useWatch({ control, name: "status" });
  const tplPhotos = useWatch({ control, name: "photoUrls" }) ?? [];

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

        try {
          const locationPhotos = await listGuideLocationPhotos(guideId);
          if (cancelled) return;
          setPortfolioPhotos(
            locationPhotos.map((photo) => ({
              id: photo.id,
              location_name: photo.location_name,
              photoUrl: supabase.storage
                .from("guide-portfolio")
                .getPublicUrl(photo.object_path).data.publicUrl,
            })),
          );
        } catch {
          if (cancelled) return;
          setPortfolioPhotos([]);
        }

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
    reset(defaultExcursionFormValues);
    setTplError(null);
    setSheetOpen(true);
  }

  function openEditSheet(template: GuideTemplateRow) {
    setEditingTemplate(template);
    reset({
      title: template.title,
      description: template.description ?? "",
      duration: template.duration_text ?? "",
      priceRub:
        template.price_from_kopecks != null
          ? String(kopecksToRub(template.price_from_kopecks))
          : "",
      status: template.status,
      meetingPoint: template.meeting_point ?? "",
      maxParticipants:
        template.max_participants != null ? String(template.max_participants) : "",
      photoUrls: template.photo_urls ?? [],
      region: template.region ?? "",
      category: template.category ?? "",
    });
    setTplError(null);
    setSheetOpen(true);
  }

  const handleTemplateValidationError: SubmitErrorHandler<ExcursionFormInput> = (errors) => {
    setTplError(
      errors.title?.message ??
        errors.priceRub?.message ??
        errors.maxParticipants?.message ??
        errors.photoUrls?.message ??
        "Ошибка сохранения.",
    );
  };

  function handleSaveTemplateClick() {
    const parsed = excursionFormSchema.safeParse(getValues());
    if (!parsed.success) {
      const titleIssue = parsed.error.issues.find((issue) => issue.path[0] === "title");
      const priceIssue = parsed.error.issues.find((issue) => issue.path[0] === "priceRub");
      const maxParticipantsIssue = parsed.error.issues.find(
        (issue) => issue.path[0] === "maxParticipants",
      );
      const photoUrlsIssue = parsed.error.issues.find((issue) => issue.path[0] === "photoUrls");
      setTplError(
        titleIssue?.message ??
          priceIssue?.message ??
          maxParticipantsIssue?.message ??
          photoUrlsIssue?.message ??
          "Ошибка сохранения.",
      );
      return;
    }

    void handleSubmit(handleSaveTemplate, handleTemplateValidationError)();
  }

  async function handleSaveTemplate(values: ExcursionFormValues) {
    setTplSaving(true);
    setTplError(null);
    try {
      if (editingTemplate) {
        const updated = await updateGuideTemplate(editingTemplate.id, {
          title: values.title,
          description: values.description,
          durationText: values.duration,
          priceFromRub: values.priceRub,
          meetingPoint: values.meetingPoint,
          maxParticipants: values.maxParticipants,
          photoUrls: values.photoUrls,
          status: values.status,
          region: values.region,
          category: values.category,
        });
        setTemplates((prev) =>
          prev.map((template) => (template.id === updated.id ? updated : template)),
        );
      } else {
        const created = await createGuideTemplate({
          title: values.title,
          description: values.description,
          durationText: values.duration,
          priceFromRub: values.priceRub,
          meetingPoint: values.meetingPoint,
          maxParticipants: values.maxParticipants,
          photoUrls: values.photoUrls,
          status: values.status,
          region: values.region,
          category: values.category,
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

      <div className="mb-6">
        <h1 className="text-xl font-semibold">Мои экскурсии</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab("excursions")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "excursions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Экскурсии
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("photos")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "photos"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Фото
        </button>
      </div>

      {activeTab === "photos" ? (
        <GuidePortfolioScreen guideId={authenticatedGuideId ?? ""} />
      ) : loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Загрузка экскурсий">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-high" />
          ))}
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : templates.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Экскурсий пока нет. Добавьте первую.
          </p>
          <button
            type="button"
            onClick={openCreateSheet}
            className="flex w-full items-center justify-center rounded-xl border border-border bg-surface-high px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            + Добавить экскурсию
          </button>
        </div>
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
          <button
            type="button"
            onClick={openCreateSheet}
            className="flex w-full items-center justify-center rounded-xl border border-border bg-surface-high px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            + Добавить экскурсию
          </button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{editingTemplate ? "Изменить экскурсию" : "Новая экскурсия"}</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4 px-4">
            <div>
              <Label htmlFor="tpl-title">
                Название <span className="text-destructive">*</span>
              </Label>
              <input
                id="tpl-title"
                type="text"
                maxLength={120}
                placeholder="Например: Тбилиси за один день"
                className={FIELD_CLASS}
                {...register("title")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-description">Текст отклика</Label>
              <Textarea
                id="tpl-description"
                maxLength={2000}
                placeholder="Описание маршрута, программа, что входит…"
                className="mt-1.5 min-h-[120px]"
                {...register("description")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-duration">Длительность</Label>
              <input
                id="tpl-duration"
                type="text"
                maxLength={60}
                placeholder="Например: 6 часов"
                className={FIELD_CLASS}
                {...register("duration")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-price">Цена от (₽) · за человека</Label>
              <input
                id="tpl-price"
                type="number"
                min={0.01}
                step={1}
                placeholder="Например: 5000"
                className={FIELD_CLASS}
                {...register("priceRub")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-meeting-point">Место сбора</Label>
              <input
                id="tpl-meeting-point"
                type="text"
                maxLength={200}
                placeholder="Например: метро Арбатская, выход 2"
                className={FIELD_CLASS}
                {...register("meetingPoint")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-max-participants">Макс. участников</Label>
              <input
                id="tpl-max-participants"
                type="number"
                min={1}
                max={500}
                placeholder="10"
                className={FIELD_CLASS}
                {...register("maxParticipants")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-region">Регион</Label>
              <input
                id="tpl-region"
                type="text"
                maxLength={100}
                placeholder="Например: Тбилиси, Грузия"
                className={FIELD_CLASS}
                {...register("region")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-category">Категория</Label>
              <select
                id="tpl-category"
                className={FIELD_CLASS}
                {...register("category")}
              >
                <option value="">Выберите категорию</option>
                {THEMES.map((theme) => (
                  <option key={theme.slug} value={theme.slug}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Фото маршрута</Label>
              {portfolioPhotos.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Добавьте фото во вкладке «Фото», затем вернитесь сюда и выберите нужные.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoPickerOpen(true)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-left text-sm text-muted-foreground hover:border-primary"
                  >
                    {tplPhotos.length > 0
                      ? `Выбрано фото: ${tplPhotos.length}`
                      : "Выбрать фото маршрута"}
                  </button>
                  <Dialog open={photoPickerOpen} onOpenChange={setPhotoPickerOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Выбрать фото маршрута</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {portfolioPhotos.map((photo) => {
                          const selected = tplPhotos.includes(photo.photoUrl);
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => {
                                setValue(
                                  "photoUrls",
                                  selected
                                    ? tplPhotos.filter((url) => url !== photo.photoUrl)
                                    : [...tplPhotos, photo.photoUrl],
                                  { shouldValidate: true },
                                );
                              }}
                              className={`relative h-16 w-full overflow-hidden rounded-lg border-2 transition-colors ${
                                selected ? "border-primary" : "border-transparent"
                              }`}
                              aria-pressed={selected}
                              aria-label={photo.location_name || "фото"}
                            >
                              <Image
                                src={photo.photoUrl}
                                alt={photo.location_name || ""}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                              {selected && (
                                <span className="absolute inset-0 flex items-center justify-center bg-primary/20 text-lg font-bold text-primary">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPhotoPickerOpen(false)}
                          className="rounded-xl border border-border bg-surface-high px-4 py-2.5 text-sm font-medium hover:bg-muted"
                        >
                          Готово
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {tplPhotos.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Выбрано: {tplPhotos.length} фото
                </p>
              )}
            </div>
            <div>
              <Label>Статус</Label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue("status", "draft", { shouldValidate: true })}
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
                  onClick={() => setValue("status", "published", { shouldValidate: true })}
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
              onClick={handleSaveTemplateClick}
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
