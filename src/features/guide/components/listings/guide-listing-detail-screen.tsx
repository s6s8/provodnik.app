"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ListingStatusDb, string> = {
  draft: "Черновик",
  published: "Опубликован",
  paused: "Приостановлен",
  rejected: "Удалён",
};

const STATUS_VARIANT: Record<
  ListingStatusDb,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  published: "secondary",
  paused: "outline",
  rejected: "destructive",
};

function formatPrice(priceMinor: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceMinor / 100);
}

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  const days = Math.round(minutes / 60 / 24);
  return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type ServerActions = {
  publishAction: (id: string) => Promise<{ error?: string }>;
  pauseAction: (id: string) => Promise<{ error?: string }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

type GuideListingDetailScreenProps = {
  listing: ListingRow;
  actions: ServerActions;
};

export function GuideListingDetailScreen({
  listing,
  actions,
}: GuideListingDetailScreenProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ListingStatusDb>(listing.status);
  const [pending, setPending] = React.useState<
    "publish" | "pause" | "delete" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (
      type: "publish" | "pause" | "delete",
      action: (id: string) => Promise<{ error?: string }>,
    ) => {
      setPending(type);
      setError(null);
      try {
        const result = await action(listing.id);
        if (result.error) {
          setError(result.error);
        } else if (type === "delete") {
          router.push("/guide/listings");
        } else {
          const next: ListingStatusDb =
            type === "publish" ? "published" : "paused";
          setStatus(next);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка.");
      } finally {
        setPending(null);
      }
    },
    [listing.id, router],
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/guide/listings">
          <ChevronLeft className="size-4" />
          Мои туры
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[status]}>
              {STATUS_LABELS[status]}
            </Badge>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            {listing.title}
          </h1>
          <p className="text-sm text-muted-foreground">{listing.region}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/guide/listings/${listing.id}/edit`}>
              <Pencil className="size-3.5" />
              Редактировать
            </Link>
          </Button>

          {(status === "draft" || status === "paused") && (
            <Button
              size="sm"
              disabled={pending !== null}
              onClick={() => void run("publish", actions.publishAction)}
            >
              {pending === "publish" ? "..." : "Опубликовать"}
            </Button>
          )}

          {status === "published" && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              onClick={() => void run("pause", actions.pauseAction)}
            >
              {pending === "pause" ? "..." : "Приостановить"}
            </Button>
          )}

          {status !== "rejected" && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  window.confirm("Удалить тур? Это действие нельзя отменить.")
                ) {
                  void run("delete", actions.deleteAction);
                }
              }}
            >
              {pending === "delete" ? "..." : "Удалить"}
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error !== null && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Цена
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-foreground">
              {formatPrice(listing.price_from_minor)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / чел.
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Группа
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-foreground">
              до {listing.max_group_size}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                чел.
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Длительность
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-foreground">
              {formatDuration(listing.duration_minutes) ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {listing.description && (
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inclusions / Exclusions */}
      {(listing.inclusions?.length > 0 || listing.exclusions?.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {listing.inclusions?.length > 0 && (
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-base">Что включено</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-foreground">
                  {listing.inclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {listing.exclusions?.length > 0 && (
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-base">Что не включено</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {listing.exclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Photo placeholder */}
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-base">Фото</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 text-sm text-muted-foreground">
            Фото можно добавить после публикации.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
