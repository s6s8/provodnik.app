import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { PageHeader } from "@/components/shared/page-header";
import { kopecksToRub } from "@/data/money";
import { formatRussianDateTime } from "@/lib/dates";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = { title: "Заявки и предложения" };

// #44: Bookings holds only confirmed rows (created at accept_offer). The
// pre-booking funnel — open traveler requests and offers still awaiting a
// traveler's decision — lives in traveler_requests / guide_offers. This surface
// gives admins visibility into that funnel without touching the Bookings ledger.
const REQUEST_STATUS_LABEL: Record<string, string> = {
  open: "Открыта",
  expired: "Истекла",
};

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает ответа",
  counter_offered: "Встречное предложение",
};

function formatMinor(minor: number | null, currency: string | null): string {
  if (!minor) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency ?? "RUB",
    maximumFractionDigits: 0,
  }).format(kopecksToRub(minor));
}

export default async function AdminPipelinePage() {
  const { adminClient } = await requireAdminSession();

  const [{ data: requests }, { data: offers }] = await Promise.all([
    adminClient
      .from("traveler_requests")
      .select(
        "id, traveler_id, destination, region, status, participants_count, budget_minor, currency, starts_on, created_at",
      )
      .in("status", ["open", "expired"])
      .order("created_at", { ascending: false })
      .limit(50),
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

  const profileIds = [
    ...new Set(
      [
        ...requestRows.map((r) => r.traveler_id),
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

  return (
    <div className="space-y-8">
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
          {requestRows.length === 0 ? (
            <EmptyState
              title="Открытых запросов нет"
              description="Новые запросы путешественников появятся здесь, пока по ним нет брони."
            />
          ) : (
            <div className="space-y-3">
              {requestRows.map((row) => (
                <ListRow
                  key={row.id}
                  href={`/requests/${row.id}`}
                  title={row.destination || "Без направления"}
                  subtitle={
                    <>
                      <span className="block truncate">
                        {[row.region, `Путешественник: ${resolveName(row.traveler_id)}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="block truncate text-xs">
                        {formatRussianDateTime(row.created_at)}
                        {row.participants_count
                          ? ` · ${row.participants_count} чел.`
                          : ""}
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
            <div className="space-y-3">
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
