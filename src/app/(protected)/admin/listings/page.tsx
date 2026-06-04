import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import {
  ensureOpenModerationCase,
  getPendingListingReviews,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

export const metadata: Metadata = {
  title: "Туры на проверке",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "published":
      return "booking-badge booking-badge--confirmed";
    case "rejected":
      return "booking-badge booking-badge--cancelled";
    case "open":
    case "pending_review":
      return "booking-badge booking-badge--pending";
    default:
      return "booking-badge booking-badge--pending";
  }
}

function listingStatusLabel(status: string) {
  switch (status) {
    case "open":
    case "pending_review":
      return "На проверке";
    case "published":
      return "Опубликован";
    case "rejected":
      return "Отклонен";
    case "draft":
      return "Черновик";
    default:
      return "На проверке";
  }
}

async function approveListingAction(listingId: string) {
  "use server";

  const { adminId } = await requireAdminSession();
  const moderationCase = await ensureOpenModerationCase({
    subjectType: "listing",
    listingId,
    queueReason: "Проверка листинга администратором",
  });

  await performModerationAction(moderationCase.id, adminId, "approve");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/listings");
}

async function rejectListingAction(listingId: string) {
  "use server";

  const { adminId } = await requireAdminSession();
  const moderationCase = await ensureOpenModerationCase({
    subjectType: "listing",
    listingId,
    queueReason: "Проверка листинга администратором",
  });

  await performModerationAction(moderationCase.id, adminId, "reject");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/listings");
}

export default async function AdminListingsPage() {
  const rows = await getPendingListingReviews();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Листинги на проверке
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Здесь только готовые экскурсии со статусом «На проверке». Черновики
          карточек в очередь не попадают.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/70 text-sm">
            <thead className="bg-surface-low text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Листинг</th>
                <th className="px-4 py-3 font-medium">Гид</th>
                <th className="px-4 py-3 font-medium">Регион</th>
                <th className="px-4 py-3 font-medium">Цена</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    В очереди нет листингов.
                  </td>
                </tr>
              ) : null}

              {rows.map((row) => {
                const guideName =
                  resolveDisplayName("guide", { full_name: row.guide_account?.full_name }) ||
                  row.guide_account?.email ||
                  "Без имени";
                const displayStatus =
                  row.moderation_case?.status === "open"
                    ? "open"
                    : row.listing.status;

                return (
                  <tr key={row.listing.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">
                        {row.listing.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.listing.category}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{guideName}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {row.listing.region}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatPrice(row.listing.price_from_minor, row.listing.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={statusBadgeClass(displayStatus)}>
                        {listingStatusLabel(displayStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(row.listing.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/listings/${row.listing.slug}`}>Просмотреть</Link>
                        </Button>
                        <form action={approveListingAction.bind(null, row.listing.id)}>
                          <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="border-success/30 bg-success/10 text-success hover:bg-success/20"
                          >
                            Одобрить
                          </Button>
                        </form>
                        <form action={rejectListingAction.bind(null, row.listing.id)}>
                          <Button type="submit" variant="destructive" size="sm">
                            Отклонить
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
