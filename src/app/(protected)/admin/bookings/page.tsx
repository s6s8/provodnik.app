import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { PageHeader } from "@/components/shared/page-header";
import { kopecksToRub } from "@/data/money";
import { formatRussianDateTime } from "@/lib/dates";
import { requireAdminSession } from "@/lib/supabase/moderation";

import { confirmPaymentAction } from "./actions";
import { STATUS_LABELS } from "./status-labels";

export const metadata = { title: "Бронирования" };

const ALL_STATUSES = "all";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { adminClient } = await requireAdminSession();

  const resolvedParams = searchParams ? await searchParams : {};
  const statusParam = Array.isArray(resolvedParams.status)
    ? resolvedParams.status[0]
    : resolvedParams.status;
  const activeStatus =
    statusParam && statusParam in STATUS_LABELS ? statusParam : ALL_STATUSES;

  const baseQuery = adminClient
    .from("bookings")
    .select(
      "id, status, subtotal_minor, currency, starts_at, created_at, traveler_id, guide_id",
    );

  const { data: bookings } = await (
    activeStatus === ALL_STATUSES
      ? baseQuery
      : baseQuery.eq("status", activeStatus)
  )
    .order("created_at", { ascending: false })
    .limit(50);

  const bookingRows = bookings ?? [];
  const profileIds = [
    ...new Set(
      bookingRows
        .flatMap((booking) => [booking.traveler_id, booking.guide_id])
        .filter((id): id is string => Boolean(id)),
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
      <PageHeader eyebrow="Администрирование" title="Бронирования" />

      <form method="get" className="flex flex-wrap items-center gap-3">
        <Select name="status" defaultValue={activeStatus}>
          <SelectTrigger
            className="min-h-[44px] w-full sm:w-64"
            aria-label="Фильтр по статусу"
          >
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>Все</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          variant="outline"
          size="default"
          className="min-h-[44px]"
        >
          Применить
        </Button>
      </form>

      {bookingRows.length === 0 ? (
        <EmptyState
          title="Бронирований пока нет"
          description="Новые бронирования появятся здесь после оформления."
        />
      ) : (
        <div className="space-y-3">
          {bookingRows.map((booking) => {
            const priceText = booking.subtotal_minor
              ? new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: booking.currency,
                  maximumFractionDigits: 0,
                }).format(kopecksToRub(booking.subtotal_minor))
              : "—";
            const statusLabel =
              STATUS_LABELS[booking.status] ?? booking.status;
            const travelerName = resolveName(booking.traveler_id);
            const guideName = resolveName(booking.guide_id);

            return (
              <ListRow
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                title={`#${booking.id.slice(-8)}`}
                subtitle={
                  <>
                    <span className="block truncate">
                      Путешественник: {travelerName} · Гид: {guideName}
                    </span>
                    <span className="block truncate text-xs">
                      {formatRussianDateTime(booking.created_at)}
                    </span>
                  </>
                }
                badge={
                  <div className="flex flex-col items-end gap-1">
                    <Badge>{statusLabel}</Badge>
                    <span className="text-xs font-medium text-foreground">
                      {priceText}
                    </span>
                  </div>
                }
                actions={
                  booking.status === "awaiting_guide_confirmation" ? (
                    <form action={confirmPaymentAction.bind(null, booking.id)}>
                      <Button
                        type="submit"
                        size="default"
                        className="min-h-[44px]"
                      >
                        Подтвердить
                      </Button>
                    </form>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
