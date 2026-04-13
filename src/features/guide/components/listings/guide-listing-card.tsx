"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const STATUS_CONFIG: Record<
  ListingStatusDb,
  { label: string; className: string }
> = {
  draft: { label: "Черновик", className: "bg-muted text-muted-foreground" },
  published: { label: "Опубликован", className: "bg-green-100 text-green-800" },
  active: { label: "Активен", className: "bg-green-100 text-green-800" },
  paused: { label: "Приостановлен", className: "bg-orange-100 text-orange-800" },
  pending_review: {
    label: "На проверке",
    className: "bg-yellow-100 text-yellow-800",
  },
  rejected: { label: "Отказано", className: "bg-red-100 text-red-800" },
  archived: { label: "В архиве", className: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: ListingStatusDb }) {
  const { label, className } = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function formatPrice(priceMinor: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceMinor / 100);
}

type GuideListingCardProps = {
  listing: ListingRow;
  onPublish: (id: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  pending: string | null;
};

export function GuideListingCard({
  listing,
  onPublish,
  onPause,
  onDelete,
  pending,
}: GuideListingCardProps) {
  const busy = pending === listing.id;

  return (
    <Card className="border-border/70 bg-card/90 transition-all hover:-translate-y-0.5">
      {listing.image_url ? (
        <div className="relative h-36 w-full overflow-hidden rounded-t-xl bg-muted">
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : null}

      <CardHeader className="pb-2 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/guide/listings/${listing.id}`}
              className="line-clamp-2 text-base font-semibold text-foreground transition-colors hover:text-primary"
            >
              {listing.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {listing.region}
              {listing.city ? `, ${listing.city}` : ""}
              {listing.duration_minutes !== null
                ? ` · ${Math.round(listing.duration_minutes / 60 / 24)} дн.`
                : null}
              {` · до ${listing.max_group_size} чел.`}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {listing.status === "rejected" && listing.rejection_reason ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            Причина: {listing.rejection_reason}
          </p>
        ) : null}

        <p className="text-sm font-semibold text-foreground">
          {formatPrice(listing.price_from_minor)}{" "}
          <span className="font-normal text-muted-foreground">/ чел.</span>
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/guide/listings/${listing.id}/edit`}>Редактировать</Link>
          </Button>

          {(listing.status === "draft" || listing.status === "paused") && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onPublish(listing.id)}
            >
              {busy ? "..." : "Опубликовать"}
            </Button>
          )}

          {(listing.status === "published" || listing.status === "active") && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onPause(listing.id)}
            >
              {busy ? "..." : "Приостановить"}
            </Button>
          )}

          {listing.status !== "rejected" && listing.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (window.confirm("Удалить тур? Это действие нельзя отменить.")) {
                  onDelete(listing.id);
                }
              }}
            >
              {busy ? "..." : "Удалить"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

