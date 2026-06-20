import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ClipboardCheck, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { PageHeader } from "@/components/shared/page-header";
import { kopecksToRub } from "@/data/money";
import { formatRussianDateTime } from "@/lib/dates";
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

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "published":
      return "default";
    case "rejected":
      return "destructive";
    case "open":
    case "pending_review":
      return "secondary";
    default:
      return "outline";
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
      <PageHeader
        eyebrow="Администрирование"
        title="Объявления на проверке"
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-6" />}
          title="В очереди нет объявлений"
          description="Готовые экскурсии со статусом «На проверке» появятся здесь. Черновики карточек в очередь не попадают."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const guideName =
              resolveDisplayName("guide", {
                full_name: row.guide_account?.full_name,
              }) ||
              row.guide_account?.email ||
              "Без имени";
            const displayStatus =
              row.moderation_case?.status === "open"
                ? "open"
                : row.listing.status;
            const priceText = new Intl.NumberFormat("ru-RU", {
              style: "currency",
              currency: row.listing.currency,
              maximumFractionDigits: 0,
            }).format(kopecksToRub(row.listing.price_from_minor));

            return (
              <ListRow
                key={row.listing.id}
                title={row.listing.title}
                subtitle={
                  <>
                    <span className="block truncate">
                      {row.listing.region} · {guideName}
                    </span>
                    <span className="block truncate text-xs">
                      {priceText}
                    </span>
                  </>
                }
                badge={
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusBadgeVariant(displayStatus)}>
                      {listingStatusLabel(displayStatus)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRussianDateTime(row.listing.created_at)}
                    </span>
                  </div>
                }
                actions={
                  <>
                    <form action={approveListingAction.bind(null, row.listing.id)}>
                      <Button
                        type="submit"
                        variant="secondary"
                        size="default"
                        className="border-success/30 bg-success/10 text-success hover:bg-success/20"
                      >
                        Одобрить
                      </Button>
                    </form>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Другие действия"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <form
                          action={rejectListingAction.bind(null, row.listing.id)}
                        >
                          <DropdownMenuItem asChild variant="destructive">
                            <button type="submit" className="w-full cursor-pointer">
                              Отклонить
                            </button>
                          </DropdownMenuItem>
                        </form>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/listings/${row.listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Просмотреть
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
