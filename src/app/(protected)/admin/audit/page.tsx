import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatRussianDateTime } from "@/lib/dates";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Журнал действий",
};

const PAGE_SIZE = 25;

const decisionLabel: Record<string, string> = {
  approve: "Одобрено",
  reject: "Отклонено",
  request_changes: "Запрошены правки",
  hide: "Скрыто",
  restore: "Восстановлено",
};

const subjectLabel: Record<string, string> = {
  guide_profile: "Анкета гида",
  listing: "Листинг",
  review: "Отзыв",
};

const SUBJECT_FILTERS = {
  guide_profile: "Гиды",
  listing: "Объявления",
  review: "Отзывы",
  availability: "Доступность",
} as const;

const ACTION_FILTERS = {
  approve: "Одобрено",
  reject: "Отклонено",
  request_changes: "Запрошены правки",
} as const;

const VALID_DECISIONS = new Set([
  "approve",
  "reject",
  "request_changes",
  "hide",
  "restore",
]);

const ALL = "all";

type SubjectFilter = keyof typeof SUBJECT_FILTERS;
type ActionFilter = keyof typeof ACTION_FILTERS;

type AuditEntry = {
  id: string;
  createdAt: string;
  adminLabel: string;
  actionLabel: string;
  subjectLabel: string;
  subjectHref: string | null;
  note: string | null;
};

function profileDisplay(
  profile: { full_name: string | null; email: string | null } | null,
  fallbackId: string | null,
) {
  if (profile?.full_name) return profile.full_name;
  if (profile?.email) return profile.email;
  if (fallbackId) return `${fallbackId.slice(0, 8)}…`;
  return "Система";
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{
    subject?: string | string[];
    action?: string | string[];
    q?: string | string[];
    page?: string | string[];
  }>;
}) {
  const { adminClient } = await requireAdminSession();

  const resolved = searchParams ? await searchParams : {};
  const subjectParam = firstParam(resolved.subject);
  const actionParam = firstParam(resolved.action);
  const query = (firstParam(resolved.q) ?? "").trim();
  const pageParam = Number.parseInt(firstParam(resolved.page) ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const activeSubject: SubjectFilter | typeof ALL =
    subjectParam && subjectParam in SUBJECT_FILTERS
      ? (subjectParam as SubjectFilter)
      : ALL;
  const activeAction: ActionFilter | typeof ALL =
    actionParam && actionParam in ACTION_FILTERS
      ? (actionParam as ActionFilter)
      : ALL;

  // moderation_actions: escalate has no matching decision → no rows.
  const runActions = activeAction === ALL || VALID_DECISIONS.has(activeAction);
  // listing_moderation_events have no decision and are always listings.
  const includeListingEvents =
    (activeSubject === ALL || activeSubject === "listing") &&
    activeAction === ALL;
  // guide_availability_events have no decision either; they are their own subject.
  const includeAvailabilityEvents =
    (activeSubject === ALL || activeSubject === "availability") &&
    activeAction === ALL;

  const actionsPromise = runActions
    ? (() => {
        let q = adminClient
          .from("moderation_actions")
          .select(
            `id, created_at, decision, note, admin_id,
             admin:profiles!moderation_actions_admin_id_fkey(full_name, email),
             case:moderation_cases!moderation_actions_case_id_fkey!inner(
               id, subject_type, guide_id, listing_id, review_id,
               listing:listings!moderation_cases_listing_id_fkey(slug, title)
             )`,
          );
        if (activeSubject !== ALL) {
          q = q.eq("case.subject_type", activeSubject);
        }
        if (activeAction !== ALL && VALID_DECISIONS.has(activeAction)) {
          q = q.eq(
            "decision",
            activeAction as "approve" | "reject" | "request_changes",
          );
        }
        if (query) {
          q = q.ilike("note", `%${query}%`);
        }
        return q
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
      })()
    : Promise.resolve({ data: [] as const });

  const listingEventsPromise = includeListingEvents
    ? (() => {
        let q = adminClient
          .from("listing_moderation_events")
          .select(
            `id, created_at, from_status, to_status, reason, listing_id, actor_id,
             actor:profiles!listing_moderation_events_actor_id_fkey(full_name, email),
             listing:listings!listing_moderation_events_listing_id_fkey(title, slug)`,
          );
        if (query) {
          q = q.ilike("reason", `%${query}%`);
        }
        return q
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
      })()
    : Promise.resolve({ data: [] as const });

  const availabilityEventsPromise = includeAvailabilityEvents
    ? adminClient
        .from("guide_availability_events")
        .select(
          `id, created_at, available, guide_id, actor_id,
           actor:profiles!guide_availability_events_actor_id_fkey(full_name, email)`,
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
    : Promise.resolve({ data: [] as const });

  const [actionsResult, listingEventsResult, availabilityEventsResult] =
    await Promise.all([
      actionsPromise,
      listingEventsPromise,
      availabilityEventsPromise,
    ]);

  const actionsRows = actionsResult.data ?? [];
  const listingRows = listingEventsResult.data ?? [];
  const availabilityRows = availabilityEventsResult.data ?? [];

  const entries: AuditEntry[] = [];

  for (const row of actionsRows) {
    const caseRow = first(row.case);
    const adminRow = first(row.admin);
    const listingRow = first(caseRow?.listing);
    let subjectHref: string | null = null;
    let subjectText = caseRow?.subject_type
      ? (subjectLabel[caseRow.subject_type] ?? caseRow.subject_type)
      : "Кейс";
    if (caseRow?.subject_type === "guide_profile" && caseRow.guide_id) {
      subjectHref = `/admin/guides/${caseRow.guide_id}`;
      subjectText = "Анкета гида";
    } else if (caseRow?.subject_type === "listing" && caseRow.listing_id) {
      subjectHref = listingRow?.slug
        ? `/listings/${listingRow.slug}`
        : "/admin/listings";
      subjectText = listingRow?.title
        ? `Листинг «${listingRow.title}»`
        : `Листинг ${caseRow.listing_id.slice(0, 8)}…`;
    } else if (caseRow?.subject_type === "review") {
      subjectHref = null;
      subjectText = "Отзыв";
    }
    entries.push({
      id: `ma-${row.id}`,
      createdAt: row.created_at,
      adminLabel: profileDisplay(adminRow, row.admin_id),
      actionLabel: decisionLabel[row.decision] ?? row.decision,
      subjectLabel: subjectText,
      subjectHref,
      note: row.note,
    });
  }

  for (const row of listingRows) {
    if (!row.created_at) continue;
    const actorRow = first(row.actor);
    const listingRow = first(row.listing);
    entries.push({
      id: `lme-${row.id}`,
      createdAt: row.created_at,
      adminLabel: profileDisplay(actorRow, row.actor_id),
      actionLabel: `Статус: ${row.from_status} → ${row.to_status}`,
      subjectLabel: listingRow?.title
        ? `Листинг «${listingRow.title}»`
        : `Листинг ${row.listing_id.slice(0, 8)}…`,
      subjectHref: listingRow?.slug
        ? `/listings/${listingRow.slug}`
        : "/admin/listings",
      note: row.reason,
    });
  }

  for (const row of availabilityRows) {
    if (!row.created_at) continue;
    const actorRow = first(row.actor);
    entries.push({
      id: `gae-${row.id}`,
      createdAt: row.created_at,
      adminLabel: profileDisplay(actorRow, row.actor_id),
      actionLabel: row.available ? "Приём возобновлён" : "Приём приостановлен",
      subjectLabel: "Доступность гида",
      subjectHref: `/admin/guides/${row.guide_id}`,
      note: null,
    });
  }

  entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const hasPrev = page > 1;
  const hasNext =
    actionsRows.length === PAGE_SIZE ||
    listingRows.length === PAGE_SIZE ||
    availabilityRows.length === PAGE_SIZE;

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (activeSubject !== ALL) params.set("subject", activeSubject);
    if (activeAction !== ALL) params.set("action", activeAction);
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Администрирование" title="Журнал действий" />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <Select name="subject" defaultValue={activeSubject}>
          <SelectTrigger
            className="min-h-[44px] w-full sm:w-52"
            aria-label="Фильтр по объекту"
          >
            <SelectValue placeholder="Все объекты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все</SelectItem>
            {Object.entries(SUBJECT_FILTERS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="action" defaultValue={activeAction}>
          <SelectTrigger
            className="min-h-[44px] w-full sm:w-52"
            aria-label="Фильтр по действию"
          >
            <SelectValue placeholder="Все действия" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все</SelectItem>
            {Object.entries(ACTION_FILTERS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Поиск по заметке"
          aria-label="Поиск по заметке"
          className="min-h-[44px] w-full sm:w-64"
        />
        <Button type="submit" variant="outline" className="min-h-[44px]">
          Применить
        </Button>
        <Button asChild variant="ghost" className="min-h-[44px]">
          <Link href="/admin/audit">Сбросить</Link>
        </Button>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title="Действий не найдено"
          description="Измените фильтры или сбросьте их, чтобы увидеть журнал."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const inner = (
              <div className="flex min-h-[44px] flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="shrink-0">
                  <Badge variant="secondary">{entry.actionLabel}</Badge>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    {entry.adminLabel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.subjectLabel}
                  </div>
                  <time
                    dateTime={entry.createdAt}
                    className="block text-xs text-muted-foreground"
                  >
                    {formatRussianDateTime(entry.createdAt)}
                  </time>
                  {entry.note ? (
                    <p className="line-clamp-4 text-sm break-words whitespace-pre-wrap text-foreground/80">
                      {entry.note}
                    </p>
                  ) : null}
                </div>
              </div>
            );
            return entry.subjectHref ? (
              <Link
                key={entry.id}
                href={entry.subjectHref}
                className="block rounded-card border border-border bg-card transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={entry.id}
                className="rounded-card border border-border bg-card"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {hasPrev || hasNext ? (
        <div className="flex items-center justify-between gap-3">
          {hasPrev ? (
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href={pageHref(page - 1)}>Назад</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">Страница {page}</span>
          {hasNext ? (
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href={pageHref(page + 1)}>Дальше</Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
