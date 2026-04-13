"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Map } from "lucide-react";

import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { GuideListingCard } from "./guide-listing-card";

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type ListingTypeTab = "all" | "excursion" | "tour" | "transfer";

const TYPE_TABS: Array<{ key: ListingTypeTab; label: string }> = [
  { key: "all", label: "Все" },
  { key: "excursion", label: "Экскурсии" },
  { key: "tour", label: "Туры" },
  { key: "transfer", label: "Трансферы" },
];

type ServerActions = {
  publishAction: (id: string) => Promise<{ error?: string }>;
  pauseAction: (id: string) => Promise<{ error?: string }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

type GuideListingsListScreenProps = {
  initialListings: ListingRow[];
  actions: ServerActions;
  /** When true, rejected listings show a rejection alert below each card. */
  showListingRejectionCard?: boolean;
};

export function GuideListingsListScreen({
  initialListings,
  actions,
}: GuideListingsListScreenProps) {
  const router = useRouter();
  const [listings, setListings] = React.useState<ListingRow[]>(initialListings);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [typeTab, setTypeTab] = React.useState<ListingTypeTab>("all");

  const filteredListings = React.useMemo(() => {
    if (typeTab === "all") return listings;
    if (typeTab === "excursion")
      return listings.filter((l) => l.exp_type === "excursion");
    if (typeTab === "tour") return listings.filter((l) => l.exp_type === "tour");
    if (typeTab === "transfer")
      return listings.filter((l) => l.exp_type === "transfer");
    return listings;
  }, [listings, typeTab]);

  const tabCounts = React.useMemo(
    () => ({
      all: listings.length,
      excursion: listings.filter((l) => l.exp_type === "excursion").length,
      tour: listings.filter((l) => l.exp_type === "tour").length,
      transfer: listings.filter((l) => l.exp_type === "transfer").length,
    }),
    [listings],
  );

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
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
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

      {listings.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-border pb-3">
          {TYPE_TABS.map((tab) => {
            const count = tabCounts[tab.key];
            const isActive = typeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
                {count > 0 ? (
                  <span
                    className={`min-w-5 rounded-full px-1.5 text-center text-xs ${
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

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
      {filteredListings.length === 0 && (
        <Card className="border-border/70 bg-card/90">
          <CardContent className="flex flex-col items-center gap-5 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Map className="size-7" strokeWidth={1.5} />
            </span>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                У вас пока нет туров
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Создайте первый маршрут, чтобы путешественники могли найти вас
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/guide/listings/new">
                  <Plus className="size-4" />
                  Создать тур
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/listings">Посмотреть примеры</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listing cards */}
      {filteredListings.length > 0 && (
        <div className="grid gap-4">
          {filteredListings.map((listing) => (
            <GuideListingCard
              key={listing.id}
              listing={listing}
              onPublish={(id) => void handlePublish(id)}
              onPause={(id) => void handlePause(id)}
              onDelete={(id) => void handleDelete(id)}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
