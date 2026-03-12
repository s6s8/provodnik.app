"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";

import { createTravelerRequestPersistent } from "@/data/traveler-request/local-store";
import {
  travelerExperienceTypes,
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { submitTravelerRequest } from "@/data/traveler-request/submit";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RequestFormValues = TravelerRequest;

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatExperienceType(
  value: TravelerRequest["experienceType"]
): string {
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

export function TravelerRequestCreateForm() {
  const [submitted, setSubmitted] = React.useState<TravelerRequestRecord | null>(
    null
  );

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      experienceType: "city",
      destination: "",
      startDate: "",
      endDate: "",
      groupSize: 2,
      groupPreference: "private",
      openToJoiningOthers: false,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 80_000,
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = form;

  const onSubmit = React.useCallback(async (values: RequestFormValues) => {
    const submission = await submitTravelerRequest(values);
    const record = await createTravelerRequestPersistent(submission.request);
    setSubmitted(record);
  }, []);

  const handleCreateAnother = React.useCallback(() => {
    setSubmitted(null);
    reset();
  }, [reset]);

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Request created locally</CardTitle>
              <p className="text-sm text-muted-foreground">
                This request is now stored locally and linked into your traveler
                workspace on this device.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow
              label="Category"
              value={formatExperienceType(submitted.request.experienceType)}
            />
            <SummaryRow label="Destination" value={submitted.request.destination} />
            <SummaryRow
              label="Dates"
              value={`${submitted.request.startDate} to ${submitted.request.endDate}`}
            />
            <SummaryRow
              label="Group size"
              value={`${submitted.request.groupSize} traveler${
                submitted.request.groupSize === 1 ? "" : "s"
              }`}
            />
            <SummaryRow
              label="Private or group"
              value={
                submitted.request.groupPreference === "private"
                  ? "Private"
                  : "Group"
              }
            />
            <SummaryRow
              label="Open to joining others"
              value={submitted.request.openToJoiningOthers ? "Yes" : "No"}
            />
            <SummaryRow
              label="Allow suggestions outside constraints"
              value={
                submitted.request.allowGuideSuggestionsOutsideConstraints
                  ? "Yes"
                  : "No"
              }
            />
            <SummaryRow
              label="Budget per person"
              value={formatRub(submitted.request.budgetPerPersonRub)}
            />
            {submitted.request.notes ? (
              <SummaryRow label="Notes" value={submitted.request.notes} />
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/traveler/requests/${submitted.id}`}>
              Open request
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/traveler/requests">View all requests</Link>
          </Button>
          <Button type="button" onClick={handleCreateAnother}>
            Create another request
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Create traveler request"
    >
      <div className="grid gap-2">
        <FieldLabel htmlFor="experienceType">Category</FieldLabel>
        <select
          id="experienceType"
          aria-invalid={Boolean(errors.experienceType)}
          aria-describedby={
            errors.experienceType ? "experienceType-error" : undefined
          }
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...register("experienceType")}
        >
          {travelerExperienceTypes.map((option) => (
            <option key={option} value={option}>
              {formatExperienceType(option)}
            </option>
          ))}
        </select>
        <FieldHint>Pick the main type of experience you want.</FieldHint>
        <FieldError
          id="experienceType-error"
          message={errors.experienceType?.message}
        />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="destination">Where do you want to go?</FieldLabel>
        <Input
          id="destination"
          placeholder="e.g. Kazan, Altai, Baikal"
          autoComplete="off"
          aria-invalid={Boolean(errors.destination)}
          aria-describedby={errors.destination ? "destination-error" : undefined}
          {...register("destination")}
        />
        <FieldHint>
          City, region, or a rough area is enough for the first pass.
        </FieldHint>
        <FieldError id="destination-error" message={errors.destination?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="startDate">Start date</FieldLabel>
          <Input
            id="startDate"
            type="date"
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? "startDate-error" : undefined}
            {...register("startDate")}
          />
          <FieldError id="startDate-error" message={errors.startDate?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="endDate">End date</FieldLabel>
          <Input
            id="endDate"
            type="date"
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? "endDate-error" : undefined}
            {...register("endDate")}
          />
          <FieldError id="endDate-error" message={errors.endDate?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="groupSize">Group size</FieldLabel>
          <Input
            id="groupSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            aria-invalid={Boolean(errors.groupSize)}
            aria-describedby={errors.groupSize ? "groupSize-error" : undefined}
            {...register("groupSize", { valueAsNumber: true })}
          />
          <FieldHint>How many travelers will join this request?</FieldHint>
          <FieldError id="groupSize-error" message={errors.groupSize?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel>Private or group</FieldLabel>
          <fieldset className="grid gap-2" aria-label="Group preference">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                value="private"
                className="mt-1"
                {...register("groupPreference")}
              />
              <span>
                <span className="font-medium text-foreground">Private</span>
                <span className="block text-xs text-muted-foreground">
                  Only your party, no added travelers.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                value="group"
                className="mt-1"
                {...register("groupPreference")}
              />
              <span>
                <span className="font-medium text-foreground">Group</span>
                <span className="block text-xs text-muted-foreground">
                  You are open to a shared group experience.
                </span>
              </span>
            </label>
          </fieldset>
          <FieldError
            id="groupPreference-error"
            message={errors.groupPreference?.message}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="budgetPerPersonRub">
            Budget per person (RUB)
          </FieldLabel>
          <Input
            id="budgetPerPersonRub"
            type="number"
            inputMode="numeric"
            min={1000}
            max={2000000}
            aria-invalid={Boolean(errors.budgetPerPersonRub)}
            aria-describedby={
              errors.budgetPerPersonRub ? "budgetPerPersonRub-error" : undefined
            }
            {...register("budgetPerPersonRub", { valueAsNumber: true })}
          />
          <FieldHint>
            A rough ceiling helps guides propose realistic itineraries.
          </FieldHint>
          <FieldError
            id="budgetPerPersonRub-error"
            message={errors.budgetPerPersonRub?.message}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            {...register("openToJoiningOthers")}
          />
          <span>
            <span className="font-medium text-foreground">
              Open to joining others
            </span>
            <span className="block text-xs text-muted-foreground">
              If you pick group, guides can suggest adding you to another
              compatible group.
            </span>
          </span>
        </label>
        <FieldError
          id="openToJoiningOthers-error"
          message={errors.openToJoiningOthers?.message}
        />
      </div>

      <div className="grid gap-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            {...register("allowGuideSuggestionsOutsideConstraints")}
          />
          <span>
            <span className="font-medium text-foreground">
              Allow suggestions outside exact constraints
            </span>
            <span className="block text-xs text-muted-foreground">
              Guides can propose nearby dates, small budget adjustments, or a
              different pace if they explain why.
            </span>
          </span>
        </label>
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
        <Textarea
          id="notes"
          placeholder="Preferences, pace, interests, accessibility needs, travel style, etc."
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          {...register("notes")}
        />
        <FieldHint>
          Keep it short; you will be able to refine once offers start coming in.
        </FieldHint>
        <FieldError id="notes-error" message={errors.notes?.message} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isSubmitSuccessful ? "Captured. You can create another anytime." : null}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          Create request
        </Button>
      </div>
    </form>
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
    <p
      {...props}
      className={cn("text-xs text-muted-foreground", className)}
    />
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
