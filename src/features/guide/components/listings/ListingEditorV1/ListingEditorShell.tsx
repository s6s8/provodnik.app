"use client";

import type { ComponentType } from "react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import {
  ALL_SECTIONS,
  SECTIONS_BY_TYPE,
  type ListingExpType,
  type SectionKey,
} from "./types";
import { CompletenessPanel } from "./completeness";
import { useAutosave } from "./useAutosave";
import type { SectionProps } from "./sections";
import {
  AudienceFactsSection,
  BasicsSection,
  DeparturesSection,
  IdeaRouteThemeSection,
  ItinerarySection,
  MeetingPointSection,
  OrgDetailsSection,
  PhotosSection,
  PickupDropoffSection,
  ScheduleSection,
  TariffsSection,
  VehicleBaggageSection,
} from "./sections";

const SECTION_COMPONENTS: Partial<
  Record<SectionKey, ComponentType<SectionProps>>
> = {
  basics: BasicsSection,
  photos: PhotosSection,
  schedule: ScheduleSection,
  tariffs: TariffsSection,
  idea_route_theme: IdeaRouteThemeSection,
  audience_facts: AudienceFactsSection,
  org_details: OrgDetailsSection,
  itinerary: ItinerarySection,
  meeting_point: MeetingPointSection,
  pickup_dropoff: PickupDropoffSection,
  vehicle_baggage: VehicleBaggageSection,
  departures: DeparturesSection,
};

const EXP_TYPE_OPTIONS: { value: ListingExpType; label: string }[] = [
  { value: "excursion", label: "Экскурсия" },
  { value: "waterwalk", label: "Прогулка на воде" },
  { value: "masterclass", label: "Мастер-класс" },
  { value: "photosession", label: "Фотосессия" },
  { value: "quest", label: "Квест" },
  { value: "activity", label: "Активность" },
  { value: "tour", label: "Тур" },
  { value: "transfer", label: "Трансфер" },
];

function listingCoverUrl(l: ListingRow): string | null {
  const row = l as ListingRow & { image_url?: string | null };
  const url = row.image_url?.trim();
  return url ? url : null;
}

function passesPublishGate(l: ListingRow): boolean {
  return Boolean(
    l.title?.trim() &&
      l.region?.trim() &&
      l.price_from_minor > 0 &&
      l.exp_type &&
      listingCoverUrl(l) &&
      l.description?.trim(),
  );
}

interface Props {
  listing: ListingRow;
  userId: string;
}

export function ListingEditorShell({ listing, userId }: Props) {
  const router = useRouter();
  const [listingState, setListingState] = useState(listing);
  const [draft, setDraft] = useState<Partial<ListingRow>>({});
  const [activeSection, setActiveSection] = useState<SectionKey | null>(() =>
    listing.exp_type ? SECTIONS_BY_TYPE[listing.exp_type][0] ?? null : null,
  );
  const { save, autosaveState } = useAutosave(listing.id, userId);

  const merged = useMemo(
    () => ({ ...listingState, ...draft }),
    [listingState, draft],
  );

  const handleChange = useCallback(
    (patch: Partial<ListingRow>) => {
      setDraft((prev) => ({ ...prev, ...patch }));
      save({ ...draft, ...patch });
    },
    [draft, save],
  );

  const sectionKeys = useMemo(
    () =>
      listingState.exp_type ? SECTIONS_BY_TYPE[listingState.exp_type] : [],
    [listingState.exp_type],
  );

  const onTitleChange = useCallback(
    (value: string) => {
      setListingState((prev) => ({ ...prev, title: value }));
      setDraft((prev) => ({ ...prev, title: value }));
      save({ title: value });
    },
    [save],
  );

  const pickExpType = useCallback(
    async (expType: ListingExpType) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("listings")
        .update({ exp_type: expType })
        .eq("id", listingState.id)
        .eq("guide_id", userId);
      if (error) return;
      setListingState((prev) => ({ ...prev, exp_type: expType }));
      const first = SECTIONS_BY_TYPE[expType][0];
      if (first) setActiveSection(first);
      router.refresh();
    },
    [listingState.id, userId, router],
  );

  const submitForReview = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("listings")
      .update({ status: "pending_review" })
      .eq("id", listingState.id)
      .eq("guide_id", userId);
    if (!error) {
      setListingState((prev) => ({
        ...prev,
        status: "pending_review" as ListingRow["status"],
      }));
      router.refresh();
    }
  }, [listingState.id, userId, router]);

  const canPublish = passesPublishGate(merged as ListingRow);

  const ActiveSection =
    activeSection != null
      ? SECTION_COMPONENTS[activeSection]
      : undefined;

  if (!listingState.exp_type) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Выберите тип тура
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Тип определяет разделы редактора
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXP_TYPE_OPTIONS.map(({ value, label }) => (
            <Card key={value} size="sm" className="p-0">
              <button
                type="button"
                className="flex w-full flex-col items-start gap-1 rounded-glass px-4 py-4 text-left transition-colors hover:bg-accent/40"
                onClick={() => void pickExpType(value)}
              >
                <span className="font-medium text-foreground">{label}</span>
              </button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-[240px] md:border-b-0 md:border-r">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Тур
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
            {merged.title || "Без названия"}
          </p>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
          {sectionKeys.map((key) => {
            const meta = ALL_SECTIONS[key];
            const isActive = activeSection === key;
            return (
              <Button
                key={key}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start whitespace-nowrap md:w-full",
                  isActive && "font-medium",
                )}
                onClick={() => setActiveSection(key)}
              >
                {meta.label}
              </Button>
            );
          })}
        </nav>
        <Separator className="my-4" />
        <CompletenessPanel listing={listingState} draft={draft} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xl">
            <Input
              value={merged.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-base font-semibold"
              aria-label="Название тура"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {autosaveState === "saving" ? (
              <Badge variant="secondary">Сохранение...</Badge>
            ) : null}
            {autosaveState === "saved" ? (
              <Badge variant="outline">Сохранено</Badge>
            ) : null}
            {autosaveState === "error" ? (
              <Badge variant="destructive">Ошибка сохранения</Badge>
            ) : null}
            {canPublish ? (
              <Button type="button" onClick={() => void submitForReview()}>
                Отправить на проверку
              </Button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {ActiveSection ? (
            <ActiveSection
              listing={listingState}
              draft={draft}
              onChange={handleChange}
              userId={userId}
            />
          ) : (
            <div className="p-8 text-sm text-muted-foreground">
              Раздел «
              {activeSection != null
                ? (ALL_SECTIONS[activeSection]?.label ?? "—")
                : "—"}
              » в разработке
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
