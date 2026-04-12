"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ListingRow, ListingStatusDb } from "@/lib/supabase/types";
import { bulkSetStatus, quickEditTitle } from "./listingManagementActions";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ListingStatusDb, string> = {
  draft: "Черновик",
  published: "Опубликован",
  paused: "Приостановлен",
  rejected: "Отклонён",
  pending_review: "На проверке",
  active: "Активен",
  archived: "В архиве",
};

const STATUS_VARIANT: Record<
  ListingStatusDb,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  published: "default",
  pending_review: "secondary",
  draft: "outline",
  paused: "secondary",
  rejected: "destructive",
  archived: "outline",
};

// ---------------------------------------------------------------------------
// Filter tab config
// ---------------------------------------------------------------------------

type FilterKey =
  | "all"
  | "active"
  | "pending_review"
  | "draft"
  | "rejected"
  | "archived";

const FILTER_TABS: {
  key: FilterKey;
  label: string;
  statuses: ListingStatusDb[];
}[] = [
  { key: "all", label: "Все", statuses: [] },
  { key: "active", label: "Активные", statuses: ["active", "published"] },
  { key: "pending_review", label: "На проверке", statuses: ["pending_review"] },
  { key: "draft", label: "Черновики", statuses: ["draft"] },
  { key: "rejected", label: "Отклонённые", statuses: ["rejected"] },
  {
    key: "archived",
    label: "В архиве",
    statuses: ["archived", "paused"],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingsTable({ listings }: { listings: ListingRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  // Filter listings by tab
  const filtered = React.useMemo(() => {
    const tab = FILTER_TABS.find((t) => t.key === filter)!;
    if (tab.statuses.length === 0) return listings;
    return listings.filter((l) =>
      (tab.statuses as ListingStatusDb[]).includes(l.status),
    );
  }, [listings, filter]);

  // Count per tab
  const countFor = (tab: (typeof FILTER_TABS)[number]) => {
    if (tab.statuses.length === 0) return listings.length;
    return listings.filter((l) =>
      (tab.statuses as ListingStatusDb[]).includes(l.status),
    ).length;
  };

  // Checkbox helpers
  const allChecked =
    filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const someChecked = filtered.some((l) => selected.has(l.id));

  function toggleAll() {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Bulk actions
  async function handleBulk(status: "active" | "archived") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setPending(true);
    try {
      await bulkSetStatus(ids, status);
      setSelected(new Set());
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  // Single row action
  async function handleRowAction(id: string, status: "active" | "archived") {
    setPending(true);
    try {
      await bulkSetStatus([id], status);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  // Quick-edit title
  function startEdit(listing: ListingRow) {
    setEditingId(listing.id);
    setEditValue(listing.title);
  }

  async function commitEdit(id: string) {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await quickEditTitle(id, editValue);
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {FILTER_TABS.map((tab) => {
          const count = countFor(tab);
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  active ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">
            Выбрано: {selectedIds.length}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            size="sm"
            variant="default"
            disabled={pending}
            onClick={() => handleBulk("active")}
          >
            Опубликовать ({selectedIds.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handleBulk("archived")}
          >
            В архив ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  onChange={toggleAll}
                  aria-label="Выбрать все"
                  className="h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-3 text-left font-medium">Название</th>
              <th className="p-3 text-left font-medium">Тип</th>
              <th className="p-3 text-left font-medium">Регион</th>
              <th className="p-3 text-left font-medium">Статус</th>
              <th className="p-3 text-left font-medium">Рейтинг</th>
              <th className="p-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground p-4"
                >
                  Нет объявлений
                </td>
              </tr>
            )}
            {filtered.map((listing) => (
              <tr key={listing.id} className="border-b last:border-0 hover:bg-muted/30">
                {/* Checkbox */}
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(listing.id)}
                    onChange={() => toggleOne(listing.id)}
                    aria-label={`Выбрать ${listing.title}`}
                    className="h-4 w-4 cursor-pointer"
                  />
                </td>

                {/* Title + thumbnail */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-muted shrink-0" />
                    )}
                    {editingId === listing.id ? (
                      <Input
                        value={editValue}
                        autoFocus
                        className="h-7 text-sm"
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(listing.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitEdit(listing.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <button
                        className="text-sm font-medium hover:underline text-left"
                        onClick={() => startEdit(listing)}
                        title="Нажмите для редактирования"
                      >
                        {listing.title}
                      </button>
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="p-3 text-muted-foreground">
                  {listing.exp_type ?? "—"}
                </td>

                {/* Region */}
                <td className="p-3">{listing.region}</td>

                {/* Status */}
                <td className="p-3">
                  <Badge variant={STATUS_VARIANT[listing.status]}>
                    {STATUS_LABEL[listing.status]}
                  </Badge>
                </td>

                {/* Rating */}
                <td className="p-3">
                  {listing.review_count > 0
                    ? `${listing.average_rating.toFixed(1)} (${listing.review_count})`
                    : "—"}
                </td>

                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/guide/listings/${listing.id}/edit`}>
                        Изменить
                      </Link>
                    </Button>
                    {(listing.status === "draft" ||
                      listing.status === "archived" ||
                      listing.status === "paused") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleRowAction(listing.id, "active")}
                      >
                        Опубликовать
                      </Button>
                    )}
                    {listing.status !== "archived" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleRowAction(listing.id, "archived")}
                      >
                        В архив
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
