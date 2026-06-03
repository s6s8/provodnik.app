import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Журнал действий",
};

const PAGE_SIZE = 100;

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

type AuditEntry = {
  id: string;
  createdAt: string;
  adminLabel: string;
  actionLabel: string;
  subjectLabel: string;
  subjectHref: string | null;
  note: string | null;
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function profileDisplay(
  profile: { full_name: string | null; email: string | null } | null,
  fallbackId: string | null,
) {
  if (profile?.full_name) return profile.full_name;
  if (profile?.email) return profile.email;
  if (fallbackId) return `${fallbackId.slice(0, 8)}…`;
  return "Система";
}

export default async function AdminAuditPage() {
  const { adminClient } = await requireAdminSession();

  const [actionsResult, listingEventsResult] = await Promise.all([
    adminClient
      .from("moderation_actions")
      .select(
        `id, created_at, decision, note, admin_id,
         admin:profiles!moderation_actions_admin_id_fkey(full_name, email),
         case:moderation_cases!moderation_actions_case_id_fkey(
           id, subject_type, guide_id, listing_id, review_id
         )`,
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
    adminClient
      .from("listing_moderation_events")
      .select(
        `id, created_at, from_status, to_status, reason, listing_id, actor_id,
         actor:profiles!listing_moderation_events_actor_id_fkey(full_name, email),
         listing:listings!listing_moderation_events_listing_id_fkey(title)`,
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
  ]);

  const entries: AuditEntry[] = [];

  for (const row of actionsResult.data ?? []) {
    const caseRow = Array.isArray(row.case) ? row.case[0] : row.case;
    const adminRow = Array.isArray(row.admin) ? row.admin[0] : row.admin;
    let subjectHref: string | null = null;
    let subjectText = caseRow?.subject_type
      ? (subjectLabel[caseRow.subject_type] ?? caseRow.subject_type)
      : "Кейс";
    if (caseRow?.subject_type === "listing" && caseRow.listing_id) {
      subjectHref = `/admin/listings`;
      subjectText = `Листинг ${caseRow.listing_id.slice(0, 8)}…`;
    } else if (caseRow?.subject_type === "guide_profile" && caseRow.guide_id) {
      subjectHref = `/admin/guides/${caseRow.guide_id}`;
      subjectText = `Анкета гида`;
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

  for (const row of listingEventsResult.data ?? []) {
    if (!row.created_at) continue;
    const actorRow = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    const listingRow = Array.isArray(row.listing) ? row.listing[0] : row.listing;
    const subjectText = listingRow?.title
      ? `Листинг «${listingRow.title}»`
      : `Листинг ${row.listing_id.slice(0, 8)}…`;
    entries.push({
      id: `lme-${row.id}`,
      createdAt: row.created_at,
      adminLabel: profileDisplay(actorRow, row.actor_id),
      actionLabel: `Статус: ${row.from_status} → ${row.to_status}`,
      subjectLabel: subjectText,
      subjectHref: `/admin/listings`,
      note: row.reason,
    });
  }

  entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const visible = entries.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline">Аудит</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Журнал действий
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Последние {visible.length} действий администраторов: модерация анкет,
          смена статусов листингов и решения по жалобам.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-6 text-sm text-muted-foreground">
          Действий пока нет.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-card">
          <ul className="divide-y divide-border">
            {visible.map((entry) => (
              <li key={entry.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {entry.adminLabel}
                      </span>
                      <Badge variant="secondary">{entry.actionLabel}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.subjectHref ? (
                        <Link
                          href={entry.subjectHref}
                          className="underline-offset-2 hover:underline"
                        >
                          {entry.subjectLabel}
                        </Link>
                      ) : (
                        entry.subjectLabel
                      )}
                    </div>
                    {entry.note ? (
                      <p className="text-sm text-foreground/80">
                        «{entry.note}»
                      </p>
                    ) : null}
                  </div>
                  <time
                    dateTime={entry.createdAt}
                    className="shrink-0 text-xs text-muted-foreground sm:text-right"
                  >
                    {formatTimestamp(entry.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
