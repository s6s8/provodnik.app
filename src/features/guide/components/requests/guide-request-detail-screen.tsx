"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  guideOfferSchema,
  type GuideOfferDraft,
} from "@/data/guide-offer/schema";
import type { TravelerRequestInboxItem } from "@/data/traveler-request/seed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatExperienceType(value: TravelerRequestInboxItem["request"]["experienceType"]) {
  switch (value) {
    case "city":
      return "City";
    case "nature":
      return "Nature";
    case "culture":
      return "Culture";
    case "food":
      return "Food";
    case "adventure":
      return "Adventure";
    case "relax":
      return "Relax";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultExpiryValue() {
  const value = new Date();
  value.setDate(value.getDate() + 2);
  value.setHours(18, 0, 0, 0);
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuideRequestDetailScreen({
  inboxItem,
}: {
  inboxItem: TravelerRequestInboxItem;
}) {
  const [submittedOffer, setSubmittedOffer] = React.useState<GuideOfferDraft | null>(
    null
  );

  const form = useForm<GuideOfferDraft>({
    resolver: zodResolver(guideOfferSchema),
    defaultValues: {
      priceTotalRub: inboxItem.request.budgetPerPersonRub * inboxItem.request.groupSize,
      timingSummary: `Reply within 24h, start around ${inboxItem.request.startDate}`,
      capacity: Math.max(inboxItem.request.groupSize, 4),
      inclusions: ["Guiding service", "Route planning", "Local recommendations"],
      expiresAt: defaultExpiryValue(),
      notes: "",
    },
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

  const inclusions = useWatch({ control, name: "inclusions" }) ?? [];

  const onSubmit = React.useCallback(async (values: GuideOfferDraft) => {
    setSubmittedOffer(values);
  }, []);

  const handleReset = React.useCallback(() => {
    setSubmittedOffer(null);
    reset();
  }, [reset]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/guide/requests">
            <ArrowLeft className="size-4" />
            Requests inbox
          </Link>
        </Button>
        <Badge variant="outline">Guide workspace</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                Traveler request from {inboxItem.traveler.displayName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Build a structured offer around this request and keep it in
                local state for MVP baseline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {formatExperienceType(inboxItem.request.experienceType)}
              </Badge>
              <Badge variant="outline">
                {inboxItem.request.startDate} to {inboxItem.request.endDate}
              </Badge>
              <Badge variant="outline">
                {inboxItem.request.groupSize} traveler
                {inboxItem.request.groupSize === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="Destination"
                value={inboxItem.request.destination}
              />
              <InfoBlock
                label="Group preference"
                value={inboxItem.request.groupPreference}
              />
              <InfoBlock
                label="Budget / person"
                value={formatRub(inboxItem.request.budgetPerPersonRub)}
              />
              <InfoBlock
                label="Flexibility"
                value={
                  inboxItem.request.allowGuideSuggestionsOutsideConstraints
                    ? "Open to nearby suggestions"
                    : "Strict constraints"
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Traveler note</p>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-sm text-foreground">
                  {inboxItem.request.notes || "No extra notes provided."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Guide framing checklist
              </p>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Address budget realism and whether the requested pace fits the
                  destination.
                </li>
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Make timing explicit so the traveler can compare offers quickly.
                </li>
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Keep inclusions structured and avoid vague free-form promises.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Structured offer composer</CardTitle>
              <p className="text-sm text-muted-foreground">
                This draft stays local. The goal is to shape the offer model
                before backend persistence exists.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-5"
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Guide offer composer"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="priceTotalRub">Total price (RUB)</FieldLabel>
                    <Input
                      id="priceTotalRub"
                      type="number"
                      inputMode="numeric"
                      min={1000}
                      aria-invalid={Boolean(errors.priceTotalRub)}
                      aria-describedby={
                        errors.priceTotalRub ? "priceTotalRub-error" : undefined
                      }
                      {...register("priceTotalRub", { valueAsNumber: true })}
                    />
                    <FieldError
                      id="priceTotalRub-error"
                      message={errors.priceTotalRub?.message}
                    />
                  </div>

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
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="timingSummary">Timing summary</FieldLabel>
                  <Input
                    id="timingSummary"
                    placeholder="e.g. 3-day route, morning starts, flexible weather swap"
                    aria-invalid={Boolean(errors.timingSummary)}
                    aria-describedby={
                      errors.timingSummary ? "timingSummary-error" : undefined
                    }
                    {...register("timingSummary")}
                  />
                  <FieldHint>
                    Keep this tight enough to compare with other guide offers.
                  </FieldHint>
                  <FieldError
                    id="timingSummary-error"
                    message={errors.timingSummary?.message}
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="inclusions">Inclusions</FieldLabel>
                  <Input
                    id="inclusions"
                    placeholder="Guiding service, museum tickets, transport support"
                    value={inclusions.join(", ")}
                    onChange={(event) => {
                      setValue("inclusions", splitCommaList(event.target.value), {
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    aria-invalid={Boolean(errors.inclusions)}
                    aria-describedby={
                      errors.inclusions ? "inclusions-error" : undefined
                    }
                  />
                  <FieldHint>
                    Use a comma-separated list. The traveler should understand
                    exactly what is included.
                  </FieldHint>
                  <FieldError
                    id="inclusions-error"
                    message={
                      typeof errors.inclusions?.message === "string"
                        ? errors.inclusions.message
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="expiresAt">Offer expires at</FieldLabel>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      aria-invalid={Boolean(errors.expiresAt)}
                      aria-describedby={errors.expiresAt ? "expiresAt-error" : undefined}
                      {...register("expiresAt")}
                    />
                    <FieldError
                      id="expiresAt-error"
                      message={errors.expiresAt?.message}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="notes">Offer note</FieldLabel>
                    <Textarea
                      id="notes"
                      placeholder="Explain pace, tradeoffs, or optional adjustments."
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={errors.notes ? "notes-error" : undefined}
                      {...register("notes")}
                    />
                    <FieldError id="notes-error" message={errors.notes?.message} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={isSubmitting}>
                    Save local draft
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {submittedOffer ? (
            <Card className="border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Local draft saved</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This structured offer is not persisted yet, but the model is
                    ready for backend wiring.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoBlock
                  label="Total price"
                  value={formatRub(submittedOffer.priceTotalRub)}
                />
                <InfoBlock
                  label="Timing summary"
                  value={submittedOffer.timingSummary}
                />
                <InfoBlock
                  label="Capacity"
                  value={`${submittedOffer.capacity} travelers`}
                />
                <InfoBlock
                  label="Expires"
                  value={formatDateLabel(submittedOffer.expiresAt)}
                />
                <InfoBlock
                  label="Inclusions"
                  value={submittedOffer.inclusions.join(", ")}
                />
                {submittedOffer.notes ? (
                  <InfoBlock label="Notes" value={submittedOffer.notes} />
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}
