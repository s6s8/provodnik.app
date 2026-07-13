import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

import { PendingSubmitButton } from "../_components/pending-submit-button";
import { confirmPaymentAction } from "./actions";
import { STATUS_LABELS } from "./status-labels";

export const metadata = { title: "Бронирования" };

const ALL_STATUSES = "all";

// ponytail: kept local (the sibling detail page carries the same 3 rows); promote to
// ./status-labels.ts if a third consumer shows up.
const STATUS_VARIANTS = {
  awaiting_guide_confirmation: "warning",
  confirmed: "success",
  cancelled: "destructive",
} as const;

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
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Администрирование" title="Бронирования" />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1.5 sm:w-64">
          <Label htmlFor="bookings-status">Статус</Label>
          <Select name="status" defaultValue={activeStatus}>
            <SelectTrigger id="bookings-status" className="h-11 w-full">
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
        </div>
        <Button type="submit" variant="outline" size="default">
          Применить
        </Button>
      </form>

      {bookingRows.length === 0 ? (
        <EmptyState
          title="Бронирований пока нет"
          description="Новые бронирования появятся здесь после оформления."
        />
      ) : (
        <div className="flex flex-col gap-3">
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
                    <Badge
                      variant={
                        STATUS_VARIANTS[
                          booking.status as keyof typeof STATUS_VARIANTS
                        ]
                      }
                    >
                      {statusLabel}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">
                      {priceText}
                    </span>
                  </div>
                }
                actions={
                  booking.status === "awaiting_guide_confirmation" ? (
                    <form action={confirmPaymentAction.bind(null, booking.id)}>
                      <PendingSubmitButton size="default">
                        Подтвердить
                      </PendingSubmitButton>
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
