import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kopecksToRub } from "@/data/money";
import { COPY } from "@/lib/copy";
import { formatRussianDateTime } from "@/lib/dates";
import { requireAdminSession } from "@/lib/supabase/moderation";

import { PendingSubmitButton } from "../../_components/pending-submit-button";
import { confirmBookingAction } from "./actions";
import { STATUS_LABELS } from "../status-labels";

export const metadata: Metadata = { title: "Бронирование" };

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { adminClient } = await requireAdminSession();

  const { data: booking } = await adminClient
    .from("bookings")
    .select(
      "id, status, subtotal_minor, currency, starts_at, ends_at, created_at, updated_at, party_size, meeting_point, traveler_id, guide_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) {
    notFound();
  }

  const profileIds = [booking.traveler_id, booking.guide_id].filter(
    (value): value is string => Boolean(value),
  );
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

  function resolveName(value: string | null) {
    if (!value) return "—";
    const name = nameById.get(value)?.trim();
    return name && name.length > 0 ? name : value.slice(-8);
  }

  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
  const priceText = booking.subtotal_minor
    ? new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: booking.currency,
        maximumFractionDigits: 0,
      }).format(kopecksToRub(booking.subtotal_minor))
    : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Бронирование"
        title={`#${booking.id.slice(-8)}`}
        actions={<Badge>{statusLabel}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Детали</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Идентификатор" value={booking.id} />
              <DetailRow label="Статус" value={statusLabel} />
              <DetailRow label="Стоимость" value={priceText} />
              <DetailRow
                label="Путешественник"
                value={resolveName(booking.traveler_id)}
              />
              <DetailRow label={COPY.guide} value={resolveName(booking.guide_id)} />
              <DetailRow
                label="Участников"
                value={booking.party_size ?? "—"}
              />
              <DetailRow
                label="Место встречи"
                value={booking.meeting_point ?? "—"}
              />
              <DetailRow
                label="Начало"
                value={
                  booking.starts_at
                    ? formatRussianDateTime(booking.starts_at)
                    : "—"
                }
              />
              <DetailRow
                label="Создано"
                value={formatRussianDateTime(booking.created_at)}
              />
              <DetailRow
                label="Обновлено"
                value={formatRussianDateTime(booking.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>

        {booking.status === "awaiting_guide_confirmation" ? (
          <Card className="border-primary/40 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Действие</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={confirmBookingAction.bind(null, booking.id)}>
                <PendingSubmitButton
                  size="default"
                  className="min-h-[44px]"
                  pendingLabel="Подтверждаем…"
                >
                  Подтвердить
                </PendingSubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
