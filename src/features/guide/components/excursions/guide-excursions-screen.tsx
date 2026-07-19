"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch, type SubmitErrorHandler } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { GuidePortfolioScreen } from "@/features/guide/components/portfolio/guide-portfolio-screen";
import { CoachCallout } from "@/features/guide/components/excursions/photobank-coach";
import { kopecksToRub } from "@/data/money";
import { THEMES } from "@/data/themes";
import { listGuideLocationPhotos } from "@/lib/supabase/guide-assets";
import {
  listActiveLocations,
  type LocationCatalogEntry,
} from "@/lib/supabase/location-catalog";
import {
  createGuideTemplate,
  deleteGuideTemplate,
  listGuideTemplates,
  updateGuideTemplate,
} from "@/lib/supabase/guide-templates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuideTemplateRow, Uuid } from "@/lib/supabase/types";
import {
  defaultExcursionFormValues,
  excursionFormSchema,
  type ExcursionFormInput,
  type ExcursionFormValues,
} from "./excursion-form-schema";

const TEMPLATE_STATUS_LABEL: Record<GuideTemplateRow["status"], string> = {
  draft: "Черновик",
  pending_review: "На проверке",
  published: "Опубликована",
  rejected: "Отклонена",
};

const TEMPLATE_STATUS_VARIANT: Record<
  GuideTemplateRow["status"],
  "default" | "secondary" | "destructive"
> = {
  draft: "secondary",
  pending_review: "secondary",
  published: "default",
  rejected: "destructive",
};

export function GuideExcursionsScreen() {
  const { confirm, ConfirmDialog } = useConfirm();
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
  const [locations, setLocations] = useState<LocationCatalogEntry[]>([]);
  const [tplSaving, setTplSaving] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  // Which field the current tplError belongs to, so the invalid input carries
  // aria-invalid + aria-describedby pointing at the footer alert (id="tpl-error").
  const [tplErrorField, setTplErrorField] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

        try {
          const activeLocations = await listActiveLocations(supabase);
          if (!cancelled) setLocations(activeLocations);
        } catch {
          if (!cancelled) setLocations([]);
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
    clearTplError();
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
      // A guide can only ever hold draft or pending_review. Editing a published or
      // rejected tour resubmits it for review — nothing goes public unreviewed.
      status: template.status === "draft" ? "draft" : "pending_review",
      meetingPoint: template.meeting_point ?? "",
      maxParticipants:
        template.max_participants != null ? String(template.max_participants) : "",
      photoUrls: template.photo_urls ?? [],
      region: template.region ?? "",
      category: template.category ?? "",
    });
    clearTplError();
    setSheetOpen(true);
  }

  // Point the alert at the first invalid field (title → price → max → photos), so
  // that field can announce itself as invalid, not just the shared alert text.
  function reportTplError(candidates: Array<[field: string, message: string | undefined]>) {
    const hit = candidates.find(([, message]) => Boolean(message));
    setTplErrorField(hit?.[0] ?? null);
    setTplError(hit?.[1] ?? "Ошибка сохранения.");
  }

  function clearTplError() {
    setTplErrorField(null);
    setTplError(null);
  }

  const handleTemplateValidationError: SubmitErrorHandler<ExcursionFormInput> = (errors) => {
    reportTplError([
      ["title", errors.title?.message],
      ["priceRub", errors.priceRub?.message],
      ["maxParticipants", errors.maxParticipants?.message],
      ["photoUrls", errors.photoUrls?.message],
    ]);
  };

  function handleSaveTemplateClick() {
    const parsed = excursionFormSchema.safeParse(getValues());
    if (!parsed.success) {
      const messageFor = (field: string) =>
        parsed.error.issues.find((issue) => issue.path[0] === field)?.message;
      reportTplError([
        ["title", messageFor("title")],
        ["priceRub", messageFor("priceRub")],
        ["maxParticipants", messageFor("maxParticipants")],
        ["photoUrls", messageFor("photoUrls")],
      ]);
      return;
    }

    void handleSubmit(handleSaveTemplate, handleTemplateValidationError)();
  }

  async function handleSaveTemplate(values: ExcursionFormValues) {
    setTplSaving(true);
    clearTplError();
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
      // A save-time failure is not tied to one field — clear any field flag.
      setTplErrorField(null);
      setTplError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setTplSaving(false);
    }
  }

  async function handleDeleteTemplate(template: GuideTemplateRow) {
    const ok = await confirm({
      title: `Удалить «${template.title}»?`,
      description: "Отменить это действие нельзя.",
      confirmText: "Удалить",
      destructive: true,
    });
    if (!ok) return;
    setDeletingTemplateId(template.id);
    setDeleteError(null);
    try {
      await deleteGuideTemplate(template.id);
      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Не удалось удалить экскурсию.");
    } finally {
      setDeletingTemplateId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        eyebrow="Кабинет гида"
        title="Мои экскурсии"
        className="mb-6"
        actions={
          <Button onClick={openCreateSheet}>
            <Plus className="size-4" /> Добавить экскурсию
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(next) => setActiveTab(next as "excursions" | "photos")}
        className="mb-6 mt-6"
      >
        <TabsList>
          <TabsTrigger value="excursions">Экскурсии</TabsTrigger>
          <TabsTrigger value="photos">Фотобанк</TabsTrigger>
        </TabsList>

        <TabsContent value="excursions">
          <CoachCallout storageKey="pb-coach-tab" show={!loading}>
            Сначала перейдите во вкладку «Фотобанк» ⬆ и загрузите фотографии ваших
            локаций в Фотобанк.
          </CoachCallout>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="Загрузка экскурсий">
              {Array.from({ length: 3 }).map((_, i) => (
                <ListRowSkeleton key={i} />
              ))}
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="Экскурсий пока нет"
              description="Добавьте первую экскурсию, чтобы откликаться на запросы путешественников."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
              {templates.map((template) => (
                <ListRow
                  key={template.id}
                  title={template.title}
                  subtitle={[
                    template.duration_text,
                    template.meeting_point,
                    template.status === "rejected" && template.rejection_reason
                      ? `Причина отклонения: ${template.rejection_reason}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  badge={
                    <Badge variant={TEMPLATE_STATUS_VARIANT[template.status]}>
                      {TEMPLATE_STATUS_LABEL[template.status]}
                    </Badge>
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Изменить"
                        onClick={() => openEditSheet(template)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить"
                        disabled={deletingTemplateId === template.id}
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  }
                  onClick={() => openEditSheet(template)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos">
          <GuidePortfolioScreen guideId={authenticatedGuideId ?? ""} />
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md">
          <SheetHeader>
            <SheetTitle>{editingTemplate ? "Изменить экскурсию" : "Новая экскурсия"}</SheetTitle>
            <SheetDescription>
              Заполните маршрут, стоимость и фото, чтобы сохранить экскурсию в кабинете гида.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto px-4">
            <div>
              <Label htmlFor="tpl-title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tpl-title"
                type="text"
                maxLength={120}
                placeholder="Например: Прогулка по центру Казани"
                className="mt-1.5"
                aria-invalid={tplErrorField === "title" || undefined}
                aria-describedby={tplErrorField === "title" ? "tpl-error" : undefined}
                {...register("title")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-description">Текст отклика</Label>
              <Textarea
                id="tpl-description"
                maxLength={2000}
                placeholder="Описание маршрута, программа, что входит…"
                className="mt-1.5 min-h-30"
                {...register("description")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-duration">Длительность</Label>
              <Input
                id="tpl-duration"
                type="text"
                maxLength={60}
                placeholder="Например: 6 часов"
                className="mt-1.5"
                {...register("duration")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-price">Цена за группу (₽)</Label>
              <Input
                id="tpl-price"
                type="number"
                min={0.01}
                step={1}
                placeholder="Например: 5000"
                className="mt-1.5"
                aria-invalid={tplErrorField === "priceRub" || undefined}
                aria-describedby={tplErrorField === "priceRub" ? "tpl-error" : undefined}
                {...register("priceRub")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-meeting-point">Место сбора</Label>
              <Input
                id="tpl-meeting-point"
                type="text"
                maxLength={200}
                placeholder="Например: метро Арбатская, выход 2"
                className="mt-1.5"
                {...register("meetingPoint")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-max-participants">Макс. участников в группе</Label>
              <Input
                id="tpl-max-participants"
                type="number"
                min={1}
                max={500}
                placeholder="10"
                className="mt-1.5"
                aria-invalid={tplErrorField === "maxParticipants" || undefined}
                aria-describedby={tplErrorField === "maxParticipants" ? "tpl-error" : undefined}
                {...register("maxParticipants")}
              />
            </div>
            <div>
              <Label htmlFor="tpl-region">Локация</Label>
              <Controller
                control={control}
                name="region"
                render={({ field }) => {
                  const value = field.value ?? "";
                  const known = locations.some((loc) => loc.name === value);
                  return (
                    <Select value={value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="tpl-region"
                        className="mt-1.5 h-12 w-full"
                        onBlur={field.onBlur}
                      >
                        <SelectValue placeholder="Выберите локацию" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Keep a legacy/retired stored value visible so an edit never loses it. */}
                        {value && !known ? (
                          <SelectItem value={value}>{value} (текущая)</SelectItem>
                        ) : null}
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.name}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {locations.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Список локаций пока пуст — обратитесь к администратору.
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="tpl-category">Категория</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="tpl-category"
                      className="mt-1.5 h-12 w-full"
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.slug} value={theme.slug}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Фото маршрута</Label>
              {portfolioPhotos.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Добавьте фото во вкладке «Фотобанк», затем вернитесь сюда и выберите нужные.
                </p>
              ) : (
                <>
                  <div className="mt-1.5">
                    <CoachCallout storageKey="pb-coach-order">
                      При создании экскурсий вы можете выбирать фото из фотобанка в
                      любой последовательности.
                    </CoachCallout>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPhotoPickerOpen(true)}
                    className="mt-1.5 w-full justify-start font-normal text-muted-foreground"
                  >
                    {tplPhotos.length > 0
                      ? `Выбрано фото: ${tplPhotos.length}`
                      : "Выбрать фото маршрута"}
                  </Button>
                  <Dialog open={photoPickerOpen} onOpenChange={setPhotoPickerOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Выбрать фото маршрута</DialogTitle>
                        <DialogDescription>
                          Выберите одно или несколько фото из портфолио для карточки экскурсии.
                        </DialogDescription>
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
                                <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                  <Check className="size-4 text-primary" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPhotoPickerOpen(false)}
                        >
                          Готово
                        </Button>
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
                  onClick={() => setValue("status", "pending_review", { shouldValidate: true })}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    tplStatus === "pending_review"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Отправить на проверку
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Готовые экскурсии публикуются после проверки администратором.
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-border px-4 pb-4 pt-4">
            {/* Kept in the sticky footer (next to Save), with role="alert", so an
                invalid submit is always visible/announced — previously this sat at
                the bottom of the scrollable body and could be scrolled out of view,
                making a rejected save look silent. */}
            {tplError && (
              <p id="tpl-error" role="alert" className="mb-3 text-sm text-destructive">
                {tplError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Отмена
              </Button>
              <Button type="button" loading={tplSaving} onClick={handleSaveTemplateClick}>
                Сохранить
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {ConfirmDialog}
    </div>
  );
}
