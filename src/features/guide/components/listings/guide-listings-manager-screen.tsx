"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  guideListingPricingModes,
  guideListingSchema,
  guideListingStatuses,
  type GuideListing,
} from "@/data/guide-listing/schema";
import {
  getSeededGuideListingRecords,
} from "@/data/guide-listing/seed";
import type { GuideListingRecord } from "@/data/guide-listing/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AuthContext } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function createListingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `gl_${crypto.randomUUID()}`;
  }

  return `gl_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function createEmptyListing(): GuideListing {
  return {
    title: "",
    region: "",
    durationHours: 3,
    capacity: 6,
    inclusions: ["Guiding service"],
    exclusions: [],
    pricing: {
      mode: "per_person",
      priceRub: 5_000,
    },
    status: "draft",
  };
}

type GuideListingsManagerScreenProps = {
  auth: AuthContext;
};

type BackendMode = "local" | "supabase";

function mapDbStatusToUi(status: ListingStatusDb): GuideListing["status"] {
  if (status === "published") return "active";
  if (status === "rejected") return "archived";
  return status;
}

function mapUiStatusToDb(status: GuideListing["status"]): ListingStatusDb {
  if (status === "active") return "published";
  if (status === "archived") return "rejected";
  return status;
}

function mapListingRowToRecord(row: ListingRow): GuideListingRecord {
  const durationHours =
    typeof row.duration_minutes === "number"
      ? Math.max(0.5, row.duration_minutes / 60)
      : 3;

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listing: {
      title: row.title,
      region: row.region,
      durationHours,
      capacity: row.max_group_size,
      inclusions: row.inclusions ?? [],
      exclusions: row.exclusions ?? [],
      pricing: {
        mode: "per_person",
        priceRub: Math.max(0, Math.round(row.price_from_minor / 100)),
      },
      status: mapDbStatusToUi(row.status),
    },
  };
}

function mapListingToDbInput(
  listing: GuideListing,
  existing?: ListingRow | null
): Partial<ListingRow> {
  const durationMinutes = Math.round(Math.max(30, listing.durationHours * 60));

  return {
    id: existing?.id,
    slug: existing?.slug ?? "",
    title: listing.title,
    region: listing.region,
    city: existing?.city ?? null,
    category: existing?.category ?? "general",
    route_summary: existing?.route_summary ?? null,
    description: existing?.description ?? null,
    duration_minutes: durationMinutes,
    max_group_size: listing.capacity,
    price_from_minor: listing.pricing.priceRub * 100,
    currency: existing?.currency ?? "RUB",
    private_available: existing?.private_available ?? true,
    group_available: existing?.group_available ?? true,
    instant_book: existing?.instant_book ?? false,
    meeting_point: existing?.meeting_point ?? null,
    inclusions: listing.inclusions,
    exclusions: listing.exclusions,
    cancellation_policy_key: existing?.cancellation_policy_key ?? "flexible",
    status: mapUiStatusToDb(listing.status),
    featured_rank: existing?.featured_rank ?? null,
  };
}

export function GuideListingsManagerScreen({ auth }: GuideListingsManagerScreenProps) {
  const [records, setRecords] = React.useState<GuideListingRecord[]>([]);
  const [backendMode, setBackendMode] = React.useState<BackendMode>("local");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    null
  );
  const [savedId, setSavedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      if (!auth.hasSupabaseEnv || !auth.isAuthenticated || auth.source !== "supabase") {
        if (!isMounted) return;
        const seeded = getSeededGuideListingRecords();
        setRecords(seeded);
        setSelectedId(seeded[0]?.id ?? null);
        setBackendMode("local");
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!isMounted) return;
          const seeded = getSeededGuideListingRecords();
          setRecords(seeded);
          setSelectedId(seeded[0]?.id ?? null);
          setBackendMode("local");
          return;
        }

        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("guide_id", user.id)
          .order("updated_at", { ascending: false });

        if (error || !data) {
          console.error("Failed to load guide listings from Supabase", error);
          if (!isMounted) return;
          const seeded = getSeededGuideListingRecords();
          setRecords(seeded);
          setSelectedId(seeded[0]?.id ?? null);
          setBackendMode("local");
          return;
        }

        const mapped = (data as ListingRow[]).map(mapListingRowToRecord);
        if (!isMounted) return;
        setRecords(mapped);
        setSelectedId(mapped[0]?.id ?? null);
        setBackendMode("supabase");
      } catch (error) {
        console.error("Failed to load guide listings from Supabase", error);
        if (!isMounted) return;
        const seeded = getSeededGuideListingRecords();
        setRecords(seeded);
        setSelectedId(seeded[0]?.id ?? null);
        setBackendMode("local");
      }
    }

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, [auth.hasSupabaseEnv, auth.isAuthenticated, auth.source]);

  const selectedRecord = React.useMemo(() => {
    if (!selectedId) return null;
    return records.find((record) => record.id === selectedId) ?? null;
  }, [records, selectedId]);

  const form = useForm<GuideListing>({
    resolver: zodResolver(guideListingSchema),
    defaultValues: selectedRecord?.listing ?? createEmptyListing(),
    mode: "onTouched",
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  React.useEffect(() => {
    reset(selectedRecord?.listing ?? createEmptyListing());
  }, [reset, selectedRecord]);

  const inclusions = useWatch({ control, name: "inclusions" }) ?? [];
  const exclusions = useWatch({ control, name: "exclusions" }) ?? [];

  const onSubmit = React.useCallback(
    async (values: GuideListing) => {
      const now = new Date().toISOString();
      const recordId = selectedRecord?.id ?? createListingId();

      if (backendMode === "supabase") {
        try {
          const supabase = createSupabaseBrowserClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            console.warn("No Supabase user session; falling back to local save.");
          } else {
            const { data: existingRows } = await supabase
              .from("listings")
              .select("*")
              .eq("id", recordId)
              .maybeSingle();

            const mappedInput = mapListingToDbInput(
              values,
              (existingRows as ListingRow | null) ?? null
            );

            const { data: upserted, error } = await supabase
              .from("listings")
              .upsert(
                {
                  ...mappedInput,
                  guide_id: user.id,
                  slug:
                    mappedInput.slug && mappedInput.slug.length > 0
                      ? mappedInput.slug
                      : `listing-${recordId}`,
                },
                { onConflict: "id" }
              )
              .select("*")
              .maybeSingle();

            if (error) {
              console.error("Failed to upsert listing to Supabase", error);
            } else if (upserted) {
              const asRow = upserted as ListingRow;
              const nextRecord = mapListingRowToRecord(asRow);
              setRecords((current) => {
                const existingIndex = current.findIndex(
                  (item) => item.id === nextRecord.id
                );
                if (existingIndex === -1) {
                  return [nextRecord, ...current];
                }
                const next = [...current];
                next[existingIndex] = nextRecord;
                return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
              });
              setSelectedId(nextRecord.id);
              setSavedId(nextRecord.id);
              return;
            }
          }
        } catch (error) {
          console.error("Failed to save listing to Supabase", error);
        }
      }

      setRecords((current) => {
        const nextRecord: GuideListingRecord = {
          id: recordId,
          createdAt: selectedRecord?.createdAt ?? now,
          updatedAt: now,
          listing: values,
        };

        const existingIndex = current.findIndex((item) => item.id === recordId);
        if (existingIndex === -1) {
          return [nextRecord, ...current];
        }

        const next = [...current];
        next[existingIndex] = nextRecord;
        return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });

      setSelectedId(recordId);
      setSavedId(recordId);
    },
    [backendMode, selectedRecord]
  );

  function handleCreateNew() {
    setSelectedId(null);
    setSavedId(null);
    reset(createEmptyListing());
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Guide workspace</Badge>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Listing manager
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
                Manage your supply and shape listing fields for MVP baseline. When
                signed in with Supabase, listings load from and save to your guide
                account; otherwise they stay local in this session.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/guide/requests">Requests inbox</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/guide/bookings">Bookings</Link>
            </Button>
            <Button type="button" onClick={handleCreateNew}>
              New listing
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Listings</CardTitle>
            <p className="text-sm text-muted-foreground">
              {records.length} seeded or locally edited listing
              {records.length === 1 ? "" : "s"}.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.map((record) => {
              const isActive = selectedId === record.id;
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(record.id);
                    setSavedId(null);
                  }}
                  className={cn(
                    "w-full rounded-xl border border-border/70 bg-background/60 p-4 text-left transition-colors",
                    isActive && "border-primary/40 bg-background"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {record.listing.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.listing.region} · {record.listing.durationHours}h
                      </p>
                    </div>
                    <Badge variant={record.listing.status === "active" ? "secondary" : "outline"}>
                      {record.listing.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {formatRub(record.listing.pricing.priceRub)}
                    </Badge>
                    <Badge variant="outline">
                      {record.listing.pricing.mode === "per_person"
                        ? "Per person"
                        : "Per group"}
                    </Badge>
                    <Badge variant="outline">
                      Updated {formatUpdatedAt(record.updatedAt)}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>
              {selectedRecord ? "Edit listing" : "New listing scaffold"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Capture the minimum launch fields for supply creation.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedId ? (
              <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
                Saved locally for listing <span className="font-medium text-foreground">{savedId}</span>.
              </div>
            ) : null}

            <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g. Kazan food walk with hidden tea rooms"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "title-error" : undefined}
                  {...register("title")}
                />
                <FieldError id="title-error" message={errors.title?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="region">Region</FieldLabel>
                  <Input
                    id="region"
                    placeholder="e.g. Kazan"
                    aria-invalid={Boolean(errors.region)}
                    aria-describedby={errors.region ? "region-error" : undefined}
                    {...register("region")}
                  />
                  <FieldError id="region-error" message={errors.region?.message} />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="durationHours">Duration (hours)</FieldLabel>
                  <Input
                    id="durationHours"
                    type="number"
                    inputMode="decimal"
                    min={0.5}
                    step={0.5}
                    aria-invalid={Boolean(errors.durationHours)}
                    aria-describedby={
                      errors.durationHours ? "durationHours-error" : undefined
                    }
                    {...register("durationHours", { valueAsNumber: true })}
                  />
                  <FieldError
                    id="durationHours-error"
                    message={errors.durationHours?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                  <Input
                    id="capacity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-invalid={Boolean(errors.capacity)}
                    aria-describedby={errors.capacity ? "capacity-error" : undefined}
                    {...register("capacity", { valueAsNumber: true })}
                  />
                  <FieldError
                    id="capacity-error"
                    message={errors.capacity?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <select
                    id="status"
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    aria-invalid={Boolean(errors.status)}
                    aria-describedby={errors.status ? "status-error" : undefined}
                    {...register("status")}
                  >
                    {guideListingStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <FieldError id="status-error" message={errors.status?.message} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="pricing.mode">Pricing mode</FieldLabel>
                  <select
                    id="pricing.mode"
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    aria-invalid={Boolean(errors.pricing?.mode)}
                    aria-describedby={
                      errors.pricing?.mode ? "pricing-mode-error" : undefined
                    }
                    {...register("pricing.mode")}
                  >
                    {guideListingPricingModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode === "per_person" ? "Per person" : "Per group"}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="pricing-mode-error"
                    message={errors.pricing?.mode?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="pricing.priceRub">Price (RUB)</FieldLabel>
                  <Input
                    id="pricing.priceRub"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    aria-invalid={Boolean(errors.pricing?.priceRub)}
                    aria-describedby={
                      errors.pricing?.priceRub ? "pricing-price-error" : undefined
                    }
                    {...register("pricing.priceRub", { valueAsNumber: true })}
                  />
                  <FieldError
                    id="pricing-price-error"
                    message={errors.pricing?.priceRub?.message}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <FieldLabel htmlFor="inclusions">Inclusions</FieldLabel>
                <Textarea
                  id="inclusions"
                  placeholder="Guiding service, route planning, local recommendations"
                  value={inclusions.join(", ")}
                  onChange={(event) => {
                    setValue("inclusions", splitCommaList(event.target.value), {
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <FieldHint>Comma-separated list of what is included.</FieldHint>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="exclusions">Exclusions</FieldLabel>
                <Textarea
                  id="exclusions"
                  placeholder="Tickets, transport, meals"
                  value={exclusions.join(", ")}
                  onChange={(event) => {
                    setValue("exclusions", splitCommaList(event.target.value), {
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <FieldHint>Comma-separated list of what is excluded.</FieldHint>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSubmitting}>
                  Save locally
                  <Save className="size-4" />
                </Button>
                <Button type="button" variant="outline" onClick={() => reset(selectedRecord?.listing ?? createEmptyListing())}>
                  Reset form
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldLabel(props: React.ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("text-sm font-medium text-foreground", props.className)}
    />
  );
}

function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p {...props} className={cn("text-xs text-muted-foreground", className)} />
  );
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
