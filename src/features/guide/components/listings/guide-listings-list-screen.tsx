"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Status chip
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

function StatusChip({ status }: { status: ListingStatusDb }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

// ---------------------------------------------------------------------------
// Price formatter
// ---------------------------------------------------------------------------

function formatPrice(priceMinor: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceMinor / 100);
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

type ActionButtonsProps = {
  listing: ListingRow;
  onPublish: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  pending: string | null;
};

function ActionButtons({
  listing,
  onPublish,
  onPause,
  onDelete,
  pending,
}: ActionButtonsProps) {
  const busy = pending === listing.id;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/guide/listings/${listing.id}/edit`}>Редактировать</Link>
      </Button>

      {(listing.status === "draft" || listing.status === "paused") && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onPublish(listing.id)}
        >
          {busy ? "..." : "Опубликовать"}
        </Button>
      )}

      {listing.status === "published" && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onPause(listing.id)}
        >
          {busy ? "..." : "Приостановить"}
        </Button>
      )}

      {listing.status !== "rejected" && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (window.confirm("Удалить тур? Это действие нельзя отменить.")) {
              void onDelete(listing.id);
            }
          }}
        >
          {busy ? "..." : "Удалить"}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type ServerActions = {
  publishAction: (id: string) => Promise<{ error?: string }>;
  pauseAction: (id: string) => Promise<{ error?: string }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

type GuideListingsListScreenProps = {
  initialListings: ListingRow[];
  actions: ServerActions;
};

export function GuideListingsListScreen({
  initialListings,
  actions,
}: GuideListingsListScreenProps) {
  const router = useRouter();
  const [listings, setListings] = React.useState<ListingRow[]>(initialListings);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visible = listings.filter((l) => l.status !== "rejected");

  const runAction = React.useCallback(
    async (
      id: string,
      action: (id: string) => Promise<{ error?: string }>,
      onSuccess: () => void,
    ) => {
      setPending(id);
      setError(null);
      try {
        const result = await action(id);
        if (result?.error) {
          setError(result.error);
        } else {
          onSuccess();
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Произошла ошибка.",
        );
      } finally {
        setPending(null);
      }
    },
    [router],
  );

  const handlePublish = React.useCallback(
    async (id: string) => {
      await runAction(id, actions.publishAction, () => {
        setListings((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, status: "published" as ListingStatusDb } : l,
          ),
        );
      });
    },
    [runAction, actions.publishAction],
  );

  const handlePause = React.useCallback(
    async (id: string) => {
      await runAction(id, actions.pauseAction, () => {
        setListings((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, status: "paused" as ListingStatusDb } : l,
          ),
        );
      });
    },
    [runAction, actions.pauseAction],
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      await runAction(id, actions.deleteAction, () => {
        setListings((prev) => prev.filter((l) => l.id !== id));
      });
    },
    [runAction, actions.deleteAction],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Кабинет гида
          </p>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Мои туры
          </h1>
        </div>
        <Button asChild>
          <Link href="/guide/listings/new">
            <Plus className="size-4" />
            Создать тур
          </Link>
        </Button>
      </div>

      {/* Error banner */}
      {error !== null && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {visible.length === 0 && (
        <Card className="border-border/70 bg-card/90">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-base font-medium text-foreground">
              У вас пока нет туров. Создайте первый.
            </p>
            <Button asChild>
              <Link href="/guide/listings/new">
                <Plus className="size-4" />
                Создать первый тур
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listing cards */}
      {visible.length > 0 && (
        <div className="grid gap-4">
          {visible.map((listing) => (
            <Card
              key={listing.id}
              className="border-border/70 bg-card/90 transition-all hover:-translate-y-0.5"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      <Link
                        href={`/guide/listings/${listing.id}`}
                        className="transition-colors hover:text-primary"
                      >
                        {listing.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {listing.region}
                      {listing.duration_minutes !== null
                        ? ` · ${Math.round(listing.duration_minutes / 60 / 24)} дн.`
                        : null}
                      {` · до ${listing.max_group_size} чел.`}
                    </p>
                  </div>
                  <StatusChip status={listing.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {formatPrice(listing.price_from_minor)}{" "}
                  <span className="font-normal text-muted-foreground">/ чел.</span>
                </p>
                <ActionButtons
                  listing={listing}
                  onPublish={handlePublish}
                  onPause={handlePause}
                  onDelete={handleDelete}
                  pending={pending}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
