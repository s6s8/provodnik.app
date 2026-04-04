"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  ClipboardList,
  Eye,
  EyeOff,
  FileWarning,
  Globe,
  MapPin,
  Tag,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  listModerationListingsForAdminFromSupabase,
  saveListingModerationActionInSupabase,
} from "@/data/admin/supabase";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";

import type {
  ListingRiskKey,
  ListingVisibility,
  ModerationAction,
  ModerationListing,
} from "@/features/admin/types/listing-moderation";

const DEFAULT_LISTINGS: readonly ModerationListing[] = [
  {
    id: "ls_20419",
    submittedAt: "2026-03-09T12:06:00Z",
    listing: {
      title: "Airport transfer - Tbilisi (private sedan)",
      category: "Transport",
      location: "Tbilisi, GE",
      language: ["en", "ru"],
      price: { amount: 19, currency: "USD" },
      sellerDisplayName: "GeoRide",
    },
    visibility: "published",
    riskSignals: {
      newSeller: false,
      priceOutlier: true,
      duplicateContent: false,
      keywordSpam: false,
      geoMismatch: false,
      riskyMedia: false,
    },
    riskReasons: ["Price is far below typical range for this route."],
    policyNotes: [
      {
        key: "needs-review",
        title: "Pricing sanity check",
        detail: "Confirm the price includes fees and matches the described vehicle capacity.",
      },
      {
        key: "allowed",
        title: "Category fit",
        detail: "Matches transport service scope; no restricted claims detected.",
      },
    ],
    excerpt:
      "Meet-and-greet at arrivals, fixed price, 24/7 availability. Sedan for up to 3 passengers with 2 suitcases.",
  },
  {
    id: "ls_20427",
    submittedAt: "2026-03-10T09:51:00Z",
    listing: {
      title: "VIP TOUR BEST PRICE GUARANTEED!!! CHEAP CHEAP",
      category: "Tours",
      location: "Yerevan, AM",
      language: ["en"],
      price: { amount: 8, currency: "USD" },
      sellerDisplayName: "Arman K.",
    },
    visibility: "needs-changes",
    riskSignals: {
      newSeller: true,
      priceOutlier: true,
      duplicateContent: true,
      keywordSpam: true,
      geoMismatch: false,
      riskyMedia: false,
    },
    riskReasons: [
      "Title appears spammy (excessive caps/punctuation).",
      "Content overlaps with other listings (possible duplication).",
      "Price is an extreme outlier for a full-day tour.",
    ],
    policyNotes: [
      {
        key: "restricted",
        title: "Misleading claims",
        detail: "Remove 'guaranteed best price' and similar unverifiable marketing claims.",
      },
      {
        key: "needs-review",
        title: "Content quality",
        detail: "Require itinerary details, duration, and inclusions; avoid keyword stuffing.",
      },
    ],
    excerpt:
      "Best VIP tour in the city! Many stops and amazing experience. Message for details. Limited time offer!!!",
  },
  {
    id: "ls_20444",
    submittedAt: "2026-03-10T18:22:00Z",
    listing: {
      title: "City apartment (daily) - near center",
      category: "Stays",
      location: "Almaty, KZ",
      language: ["ru"],
      price: { amount: 25, currency: "USD" },
      sellerDisplayName: "A. S.",
    },
    visibility: "hidden",
    riskSignals: {
      newSeller: true,
      priceOutlier: false,
      duplicateContent: false,
      keywordSpam: false,
      geoMismatch: true,
      riskyMedia: true,
    },
    riskReasons: [
      "Location metadata conflicts with text (mentions 'Astana' in description).",
      "Media set contains low-quality or mismatched images.",
    ],
    policyNotes: [
      {
        key: "needs-review",
        title: "Location accuracy",
        detail: "Ensure the city/area matches the listing; do not misrepresent the location.",
      },
      {
        key: "needs-review",
        title: "Media quality",
        detail: "Require real photos of the property; reject stock imagery.",
      },
    ],
    excerpt:
      "Comfortable apartment with quick access to downtown. Quiet building. Photos available. Great option for travelers.",
  },
] as const;

type ActionFilter = ModerationAction | "all";

type ListingState = Record<
  string,
  {
    action: ModerationAction;
    note: string;
    visibility: ListingVisibility;
    decidedAt?: string;
  }
>;

function formatAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesQuery(item: ModerationListing, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.id,
    item.listing.title,
    item.listing.category,
    item.listing.location,
    item.listing.sellerDisplayName,
    item.listing.language.join(" "),
    item.excerpt,
    item.riskReasons.join(" "),
    item.policyNotes.map((n) => `${n.title} ${n.detail}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function riskLabel(key: ListingRiskKey) {
  switch (key) {
    case "newSeller":
      return "Новый продавец";
    case "priceOutlier":
      return "Аномальная цена";
    case "duplicateContent":
      return "Дубли контента";
    case "keywordSpam":
      return "Спам в тексте";
    case "geoMismatch":
      return "Несовпадение гео";
    case "riskyMedia":
      return "Риск-медиа";
  }
}

function visibilityBadge(visibility: ListingVisibility) {
  switch (visibility) {
    case "draft":
      return { label: "Черновик", variant: "outline" as const };
    case "published":
      return { label: "Опубликовано", variant: "secondary" as const };
    case "hidden":
      return { label: "Скрыто", variant: "outline" as const };
    case "blocked":
      return { label: "Заблокировано", variant: "destructive" as const };
    case "needs-changes":
      return { label: "Нужны правки", variant: "default" as const };
  }
}

function actionBadge(action: ModerationAction) {
  switch (action) {
    case "pending":
      return { label: "В очереди", variant: "outline" as const };
    case "approve":
      return { label: "Одобрено", variant: "secondary" as const };
    case "hide":
      return { label: "Скрыто", variant: "outline" as const };
    case "block":
      return { label: "Заблокировано", variant: "destructive" as const };
    case "request-changes":
      return { label: "Нужны правки", variant: "default" as const };
  }
}

function policyBadgeVariant(key: ModerationListing["policyNotes"][number]["key"]) {
  switch (key) {
    case "allowed":
      return "secondary" as const;
    case "needs-review":
      return "outline" as const;
    case "restricted":
      return "default" as const;
    case "disallowed":
      return "destructive" as const;
  }
}

export function ListingModerationQueue() {
  const [items, setItems] = React.useState(() => DEFAULT_LISTINGS);
  const [backendMode, setBackendMode] = React.useState<"local" | "supabase">("local");
  const [query, setQuery] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<ActionFilter>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [listingState, setListingState] = React.useState<ListingState>(() => {
    const initial: ListingState = {};
    for (const item of DEFAULT_LISTINGS) {
      initial[item.id] = {
        action: "pending",
        note: "",
        visibility: item.visibility,
      };
    }
    return initial;
  });

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const persisted = await listModerationListingsForAdminFromSupabase();
        if (!persisted.length || ignore) return;

        setItems(persisted);
        setListingState(() => {
          const next: ListingState = {};
          for (const item of persisted) {
            next[item.id] = item.moderationState;
          }
          return next;
        });
        setBackendMode("supabase");
      } catch {
        if (ignore) return;
        setBackendMode("local");
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const visible = React.useMemo(() => {
    return items.filter((item) => {
      const state = listingState[item.id]?.action ?? "pending";
      if (actionFilter !== "all" && state !== actionFilter) return false;
      return matchesQuery(item, query);
    });
  }, [actionFilter, items, listingState, query]);

  const counts = React.useMemo(() => {
    const all = items.length;
    let pending = 0;
    let approve = 0;
    let hide = 0;
    let block = 0;
    let requestChanges = 0;

    for (const item of items) {
      const action = listingState[item.id]?.action ?? "pending";
      if (action === "pending") pending += 1;
      else if (action === "approve") approve += 1;
      else if (action === "hide") hide += 1;
      else if (action === "block") block += 1;
      else requestChanges += 1;
    }

    return { all, pending, approve, hide, block, requestChanges };
  }, [items, listingState]);

  const applyAction = React.useCallback(
    async (id: string, action: ModerationAction, nextVisibility: ListingVisibility) => {
      setListingState((prev) => ({
        ...prev,
        [id]: {
          action,
          note: prev[id]?.note ?? "",
          visibility: nextVisibility,
          decidedAt: new Date().toISOString(),
        },
      }));

      if (backendMode === "supabase") {
        try {
          const nextState = await saveListingModerationActionInSupabase({
            listingId: id,
            action,
            note: listingState[id]?.note ?? "",
          });

          setListingState((prev) => ({
            ...prev,
            [id]: nextState,
          }));
        } catch (error) {
          console.error("Failed to persist listing moderation action", error);
        }
      }

      const listing = items.find((item) => item.id === id);
      if (listing) {
        void recordMarketplaceEventFromClient({
          scope: "moderation",
          requestId: null,
          bookingId: null,
          disputeId: null,
          actorId: null,
          eventType: "listing_moderation_action",
          summary: `Listing ${id} moderation action ${action}`,
          detail: `${listing.listing.title} visibility set to ${nextVisibility}`,
          payload: {
            listingId: id,
            action,
            visibility: nextVisibility,
            seller: listing.listing.sellerDisplayName,
          },
        });
      }
    },
    [backendMode, items, listingState],
  );

  const setNote = React.useCallback((id: string, note: string) => {
    setListingState((prev) => ({
      ...prev,
      [id]: {
        action: prev[id]?.action ?? "pending",
        note,
        visibility: prev[id]?.visibility ?? "draft",
        decidedAt: prev[id]?.decidedAt,
      },
    }));

    if (!note.trim()) return;

    const listing = items.find((item) => item.id === id);
    if (listing) {
      void recordMarketplaceEventFromClient({
        scope: "moderation",
        requestId: null,
        bookingId: null,
        disputeId: null,
        actorId: null,
        eventType: "listing_moderation_note",
        summary: `Listing ${id} moderation note updated`,
        detail: note,
        payload: {
          listingId: id,
          seller: listing.listing.sellerDisplayName,
        },
      });
    }
  }, [items]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Админ‑панель</Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Модерация объявлений
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Проверяйте новые и рискованные объявления, оценивайте сигналы риска
                и управляйте видимостью предложений на маркетплейсе.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/admin">
                <ClipboardList className="mr-1 size-4" />
                Проверка гидов
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/disputes">
                <AlertTriangle className="mr-1 size-4" />
                Споры и возвраты
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Фильтры очереди</CardTitle>
              <CardDescription>
                Фильтруйте по действию модерации и ищите по названию, продавцу и ID.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Все {counts.all}</Badge>
              <Badge variant="outline">В очереди {counts.pending}</Badge>
              <Badge variant="outline">Одобрено {counts.approve}</Badge>
              <Badge variant="outline">Нужны правки {counts.requestChanges}</Badge>
              <Badge variant="outline">Скрыто {counts.hide}</Badge>
              <Badge variant="outline">Заблокировано {counts.block}</Badge>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по названию, продавцу, локации, ID, сигналам..."
                aria-label="Поиск по объявлениям"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={actionFilter === "all" ? "secondary" : "outline"}
                onClick={() => setActionFilter("all")}
              >
                Все
              </Button>
              <Button
                type="button"
                variant={actionFilter === "pending" ? "secondary" : "outline"}
                onClick={() => setActionFilter("pending")}
              >
                В очереди
              </Button>
              <Button
                type="button"
                variant={actionFilter === "request-changes" ? "secondary" : "outline"}
                onClick={() => setActionFilter("request-changes")}
              >
                Нужны правки
              </Button>
              <Button
                type="button"
                variant={actionFilter === "approve" ? "secondary" : "outline"}
                onClick={() => setActionFilter("approve")}
              >
                Одобрено
              </Button>
              <Button
                type="button"
                variant={actionFilter === "hide" ? "secondary" : "outline"}
                onClick={() => setActionFilter("hide")}
              >
                Скрыто
              </Button>
              <Button
                type="button"
                variant={actionFilter === "block" ? "secondary" : "outline"}
                onClick={() => setActionFilter("block")}
              >
                Заблокировано
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">No results</CardTitle>
              <CardDescription>
                Try clearing filters or adjusting the search query.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          visible.map((item) => {
            const state = listingState[item.id] ?? {
              action: "pending" as const,
              note: "",
              visibility: item.visibility,
            };
            const action = actionBadge(state.action);
            const visibility = visibilityBadge(state.visibility);
            const expanded = expandedId === item.id;

            const riskKeys = Object.keys(item.riskSignals) as ListingRiskKey[];
            const enabledRisk = riskKeys.filter((k) => item.riskSignals[k]);

            return (
              <Card key={item.id} className="border-border/70 bg-card/90">
                <CardHeader className="gap-2 space-y-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{item.listing.title}</CardTitle>
                        <Badge variant={action.variant}>{action.label}</Badge>
                        <Badge variant={visibility.variant}>{visibility.label}</Badge>
                        <Badge variant="outline">{item.id}</Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="size-3.5" />
                          {item.listing.category}
                        </span>
                        <span className="text-muted-foreground/50">-</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {item.listing.location}
                        </span>
                        <span className="text-muted-foreground/50">-</span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="size-3.5" />
                          {item.listing.price.amount} {item.listing.price.currency}
                        </span>
                        <span className="text-muted-foreground/50">-</span>
                <span>Продавец {item.listing.sellerDisplayName}</span>
                        <span className="text-muted-foreground/50">-</span>
                <span>Заявка от {formatAt(item.submittedAt)}</span>
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setExpandedId((prev) => (prev === item.id ? null : item.id))
                        }
                        aria-expanded={expanded}
                      >
                {expanded ? "Свернуть" : "Показать детали"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => applyAction(item.id, "approve", "published")}
                      >
                        <Eye className="mr-1 size-4" />
                Опубликовать
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyAction(item.id, "request-changes", "needs-changes")}
                      >
                        <FileWarning className="mr-1 size-4" />
                Запросить правки
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyAction(item.id, "hide", "hidden")}
                      >
                        <EyeOff className="mr-1 size-4" />
                Скрыть
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => applyAction(item.id, "block", "blocked")}
                      >
                        <Ban className="mr-1 size-4" />
                Заблокировать
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="size-4" />
                  <span>Языки: {item.listing.language.join(", ")}</span>
                      </div>
                      <p className="max-w-3xl text-sm text-foreground">{item.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={enabledRisk.length > 0 ? "default" : "outline"}>
                        <AlertTriangle className="mr-1 size-3" />
                    Сигналы риска: {enabledRisk.length}/{riskKeys.length}
                      </Badge>
                      {item.policyNotes.length > 0 ? (
                        <Badge variant="outline">
                          <ClipboardList className="mr-1 size-3" />
                      Политики: {item.policyNotes.length}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {expanded ? (
                    <div className="space-y-4">
                      <Separator />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            Сигналы риска
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {riskKeys.map((key) => {
                              const enabled = item.riskSignals[key];
                              return (
                                <Badge
                                  key={key}
                                  variant={enabled ? "default" : "outline"}
                                >
                                  {riskLabel(key)}
                                </Badge>
                              );
                            })}
                          </div>
                          {item.riskReasons.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {item.riskReasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Объяснения сигналов риска для этого примера не заданы.
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            Политики и требования
                          </div>
                          <div className="space-y-2">
                            {item.policyNotes.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                No policy notes for this listing.
                              </div>
                            ) : (
                              item.policyNotes.map((note) => (
                                <div
                                  key={note.title}
                                  className="rounded-md border border-border/70 bg-background/40 p-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="text-sm font-medium text-foreground">
                                      {note.title}
                                    </div>
                                    <Badge variant={policyBadgeVariant(note.key)}>
                                      {note.key.replace("-", " ")}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {note.detail}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                          Комментарий модерации
                        </div>
                        <Textarea
                          value={state.note}
                          onChange={(event) => setNote(item.id, event.target.value)}
                          placeholder="Зафиксируйте обоснование решения, необходимые правки и ссылки на доказательства."
                          aria-label="Комментарий модерации"
                        />
                        <div className="text-xs text-muted-foreground">
                          Последнее действие: {action.label}
                          {state.decidedAt ? ` · ${formatAt(state.decidedAt)}` : ""}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-muted-foreground">
            В демо‑режиме действия и заметки хранятся локально и сбрасываются при обновлении.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setListingState((prev) => ({
                          ...prev,
                          [item.id]: {
                            action: "pending",
                            note: "",
                            visibility: item.visibility,
                          },
                        }))
                      }
                    >
              Сбросить решение
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

