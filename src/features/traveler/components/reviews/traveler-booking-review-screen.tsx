"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { addLocalReview } from "@/data/reviews/local-store";
import type { ReviewRecord, ReviewTargetType } from "@/data/reviews/types";
import {
  reviewSubmissionSchema,
  type ReviewSubmission,
} from "@/data/reviews/schema";
import { getTravelerBookingById } from "@/data/traveler-booking/local-store";
import type { TravelerBookingRecord } from "@/data/traveler-booking/types";
import { cn } from "@/lib/utils";

type ReviewFormValues = ReviewSubmission;

function buildReviewId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `rev_local_${crypto.randomUUID()}`;
  }
  return `rev_local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function featuredTargetsForBooking(record: TravelerBookingRecord): Array<{
  type: ReviewTargetType;
  slug: string;
  label: string;
}> {
  const targets: Array<{ type: ReviewTargetType; slug: string; label: string }> =
    [];

  if (record.guide.slug) {
    targets.push({
      type: "guide",
      slug: record.guide.slug,
      label: `Guide: ${record.guide.displayName}`,
    });
  }

  if (record.listingSlug) {
    targets.push({
      type: "listing",
      slug: record.listingSlug,
      label: "Listing itinerary",
    });
  }

  return targets;
}

export function TravelerBookingReviewScreen({ bookingId }: { bookingId: string }) {
  const [record, setRecord] = React.useState<TravelerBookingRecord | null>(null);
  const [submitted, setSubmitted] = React.useState<ReviewRecord | null>(null);

  React.useEffect(() => {
    setRecord(getTravelerBookingById(bookingId));
  }, [bookingId]);

  const targets = React.useMemo(() => {
    if (!record) return [];
    return featuredTargetsForBooking(record);
  }, [record]);

  const defaultTarget = targets[0];

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: defaultTarget
      ? {
          targetType: defaultTarget.type,
          targetSlug: defaultTarget.slug,
          rating: 5,
          title: "",
          body: "",
          tags: [],
        }
      : {
          targetType: "guide",
          targetSlug: "",
          rating: 5,
          title: "",
          body: "",
          tags: [],
        },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const rating = useWatch({ control: form.control, name: "rating" });
  const targetType = useWatch({ control: form.control, name: "targetType" });
  const targetSlug = useWatch({ control: form.control, name: "targetSlug" });

  const onSubmit = React.useCallback(
    async (values: ReviewFormValues) => {
      if (!record) return;
      const now = new Date().toISOString();

      const review: ReviewRecord = {
        id: buildReviewId(),
        createdAt: now,
        author: {
          userId: "usr_local_traveler_you",
          displayName: record.traveler.displayName || "You",
        },
        target: {
          type: values.targetType,
          slug: values.targetSlug,
        },
        rating: values.rating,
        title: values.title,
        body: values.body,
        tags: values.tags?.length ? values.tags : undefined,
      };

      addLocalReview(review);
      setSubmitted(review);
    },
    [record],
  );

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Traveler workspace</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Booking not found</CardTitle>
            <p className="text-sm text-muted-foreground">
              This booking ID doesn’t exist on this device.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/traveler/bookings">
                <ArrowLeft className="size-4" />
                Back to bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (record.status !== "completed") {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Traveler workspace</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Review not available yet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reviews unlock once a booking is marked completed.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href={`/traveler/bookings/${record.id}`}>
                <ArrowLeft className="size-4" />
                Back to booking
              </Link>
            </Button>
            <Button asChild>
              <Link href="/traveler/bookings">View all bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Traveler workspace</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Review saved locally</CardTitle>
              <p className="text-sm text-muted-foreground">
                This review is stored on this device only (no backend yet).
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-medium text-foreground">
                {submitted.target.type} · {submitted.target.slug}
              </p>
            </div>
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-sm font-medium text-foreground">
                {submitted.rating} / 5
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/traveler/bookings/${record.id}`}>
              <ArrowLeft className="size-4" />
              Back to booking
            </Link>
          </Button>
          {record.guide.slug ? (
            <Button asChild variant="secondary">
              <Link href={`/guides/${record.guide.slug}`}>Open guide profile</Link>
            </Button>
          ) : null}
          {record.listingSlug ? (
            <Button asChild variant="secondary">
              <Link href={`/listings/${record.listingSlug}`}>Open listing</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href={`/traveler/bookings/${record.id}`}>
            <ArrowLeft className="size-4" />
            Booking
          </Link>
        </Button>
        <div className="space-y-2">
          <Badge variant="outline">Traveler workspace</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Leave a review
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Short, concrete feedback builds trust. No moderation backend yet—keep
            it factual and helpful.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Review details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Booking: {record.request.destination} · {record.request.startDate}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {targets.length > 1 ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Review target</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {targets.map((target) => {
                  const isActive =
                    targetType === target.type && targetSlug === target.slug;
                  return (
                    <Button
                      key={`${target.type}:${target.slug}`}
                      type="button"
                      variant={isActive ? "default" : "secondary"}
                      className="justify-start"
                      onClick={() => {
                        setValue("targetType", target.type, { shouldValidate: true });
                        setValue("targetSlug", target.slug, { shouldValidate: true });
                      }}
                    >
                      {target.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Separator />

          <form
            className="grid gap-5"
            onSubmit={handleSubmit(onSubmit)}
            aria-label="Submit traveler review"
          >
            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Rating</p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5] as const).map((value) => {
                  const active = rating === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={active ? "default" : "secondary"}
                      onClick={() => setValue("rating", value, { shouldValidate: true })}
                      aria-pressed={active}
                      className="gap-2"
                    >
                      <Star className={cn("size-4", active ? "text-primary-foreground" : "")} />
                      {value}
                    </Button>
                  );
                })}
              </div>
              {errors.rating?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.rating.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <Input
                id="title"
                placeholder="e.g. Clear pacing and logistics"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                {...register("title")}
              />
              {errors.title?.message ? (
                <p id="title-error" className="text-xs font-medium text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium text-foreground">
                What went well (and what could improve)?
              </label>
              <Textarea
                id="body"
                placeholder="Aim for specifics: pacing, logistics, safety, context, communication..."
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? "body-error" : undefined}
                {...register("body")}
              />
              {errors.body?.message ? (
                <p id="body-error" className="text-xs font-medium text-destructive">
                  {errors.body.message}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Stored locally only. Don’t include phone numbers or private details.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {errors.targetSlug?.message ? (
                  <span className="text-destructive">{errors.targetSlug.message}</span>
                ) : null}
              </p>
              <Button type="submit" disabled={isSubmitting}>
                Save review locally
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

