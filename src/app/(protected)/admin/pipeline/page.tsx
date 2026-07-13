import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { PageHeader } from "@/components/shared/page-header";
import { kopecksToRub } from "@/data/money";
import { formatRussianDateTime } from "@/lib/dates";
import { requireAdminSession } from "@/lib/supabase/moderation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Заявки и предложения" };

// #44: Bookings holds only confirmed rows (created at accept_offer). The
// pre-booking funnel — traveler requests in every status and offers still
// awaiting a traveler's decision — lives in traveler_requests / guide_offers.
// This surface gives admins full-funnel visibility, not just open requests.
const REQUEST_STATUS_LABEL: Record<string, string> = {
  open: "Открыта",
  booked: "Забронирована",
  cancelled: "Отменена",
  expired: "Истекла",
};

const REQUEST_STATUS_FILTERS = ["open", "booked", "cancelled", "expired"] as const;

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает ответа",
  counter_offered: "Встречное предложение",
};

function StatusChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-low text-ink-2 hover:bg-surface",
      )}
    >
      {label}
    </Link>
  );
}

function formatMinor(minor: number | null, currency: string | null): string {
  if (!minor) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency ?? "RUB",
    maximumFractionDigits: 0,
  }).format(kopecksToRub(minor));
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { adminClient } = await requireAdminSession();

  const { status: statusParam } = await searchParams;
  const statusFilter = REQUEST_STATUS_FILTERS.includes(
    statusParam as (typeof REQUEST_STATUS_FILTERS)[number],
  )
    ? statusParam
    : null;

  const requestsQuery = adminClient
    .from("traveler_requests")
    .select(
      "id, traveler_id, destination, region, status, participants_count, budget_minor, currency, starts_on, open_to_join, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (statusFilter) requestsQuery.eq("status", statusFilter);

  const [{ data: requests }, { data: offers }] = await Promise.all([
    requestsQuery,
    adminClient
      .from("guide_offers")
      .select(
        "id, guide_id, request_id, status, price_minor, currency, capacity, starts_at, created_at",
      )
      .in("status", ["pending", "counter_offered"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const requestRows = requests ?? [];
  const offerRows = offers ?? [];

  const requestIds = requestRows.map((row) => row.id).filter(Boolean);
  const { data: memberRows } = requestIds.length > 0
    ? await adminClient
        .from("open_request_members")
        .select("request_id, traveler_id, status, joined_at")
        .in("request_id", requestIds)
        .order("joined_at", { ascending: true })
    : { data: [] };

  const profileIds = [
    ...new Set(
      [
        ...requestRows.map((r) => r.traveler_id),
        ...(memberRows ?? []).map((m) => m.traveler_id),
        ...offerRows.map((o) => o.guide_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];

  const nameById = new Map<string, string | null>();
  if (profileIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", profileIds);
    for (const profile of profiles ?? []) {
      nameById.set(profile.id, profile.full_name);
    }
  }

  function resolveName(id: string | null) {
    if (!id) return "—";
    const name = nameById.get(id)?.trim();
    return name && name.length > 0 ? name : id.slice(-8);
  }

  const membersByRequestId = new Map<string, string[]>();
  for (const member of memberRows ?? []) {
    if (!member.request_id || !member.traveler_id) continue;
    const list = membersByRequestId.get(member.request_id) ?? [];
    list.push(`${resolveName(member.traveler_id)}${member.status ? ` (${member.status})` : ""}`);
    membersByRequestId.set(member.request_id, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Администрирование"
        title="Заявки и предложения"
        subtitle="Открытые запросы и предложения гидов до подтверждения брони. Подтверждённые брони — на странице «Бронирования»."
      />

      <Tabs defaultValue="requests" className="mt-2">
        <TabsList>
          <TabsTrigger value="requests">
            Запросы
            <Badge variant="secondary">{requestRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="offers">
            Предложения
            <Badge variant="secondary">{offerRows.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusChip label="Все" active={!statusFilter} href="/admin/pipeline" />
            {REQUEST_STATUS_FILTERS.map((s) => (
              <StatusChip
                key={s}
                label={REQUEST_STATUS_LABEL[s]}
                active={statusFilter === s}
                href={`/admin/pipeline?status=${s}`}
              />
            ))}
          </div>
          {requestRows.length === 0 ? (
            <EmptyState
              title="Запросов нет"
              description="Запросы путешественников появятся здесь по мере поступления."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {requestRows.map((row) => (
                <ListRow
                  key={row.id}
                  href={`/requests/${row.id}`}
                  title={row.destination || "Без направления"}
                  subtitle={
                    <>
                      <span className="block truncate">
                        {[
                          row.region,
                          row.open_to_join ? "Сборная группа" : "Своя группа",
                          `Путешественник: ${resolveName(row.traveler_id)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="block truncate text-xs">
                        {formatRussianDateTime(row.created_at)}
                        {row.participants_count
                          ? ` · ${row.participants_count} чел.`
                          : ""}
                      </span>
                      <span className="block truncate text-xs">
                        Участники: {membersByRequestId.get(row.id)?.join(", ") || "только автор"}
                      </span>
                    </>
                  }
                  badge={
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">
                        {REQUEST_STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                      <span className="text-xs font-medium text-foreground">
                        {formatMinor(row.budget_minor, row.currency)}
                      </span>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers">
          {offerRows.length === 0 ? (
            <EmptyState
              title="Активных предложений нет"
              description="Предложения гидов, ожидающие ответа путешественника, появятся здесь."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {offerRows.map((row) => (
                <ListRow
                  key={row.id}
                  href={`/requests/${row.request_id}`}
                  title={`Гид: ${resolveName(row.guide_id)}`}
                  subtitle={
                    <>
                      <span className="block truncate">
                        Запрос #{row.request_id.slice(-8)}
                        {row.capacity ? ` · ${row.capacity} чел.` : ""}
                      </span>
                      <span className="block truncate text-xs">
                        {formatRussianDateTime(row.created_at)}
                      </span>
                    </>
                  }
                  badge={
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">
                        {OFFER_STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                      <span className="text-xs font-medium text-foreground">
                        {formatMinor(row.price_minor, row.currency)}
                      </span>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
