import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureOpenModerationCase,
  getGuideReviewQueue,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";
import type { GuideReviewQueueView } from "@/lib/supabase/moderation";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

export const metadata: Metadata = {
  title: "Очередь верификации",
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

function verificationBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "submitted":
      return "secondary";
    default:
      return "outline";
  }
}

function verificationLabel(status: string) {
  switch (status) {
    case "approved":
      return "Одобрен";
    case "rejected":
      return "Отклонен";
    case "submitted":
      return "На проверке";
    default:
      return "Черновик";
  }
}

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveQueueView(value: string | string[] | undefined): GuideReviewQueueView {
  return resolveSearchValue(value) === "drafts" ? "drafts" : "all";
}

async function approveGuideAction(guideId: string) {
  "use server";

  const { adminId } = await requireAdminSession();
  const moderationCase = await ensureOpenModerationCase({
    subjectType: "guide_profile",
    guideId,
    queueReason: "Проверка анкеты гида",
  });

  await performModerationAction(moderationCase.id, adminId, "approve");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/guides");
  revalidatePath(`/admin/guides/${guideId}`);
}

async function rejectGuideAction(guideId: string) {
  "use server";

  const { adminId } = await requireAdminSession();
  const moderationCase = await ensureOpenModerationCase({
    subjectType: "guide_profile",
    guideId,
    queueReason: "Проверка анкеты гида",
  });

  await performModerationAction(moderationCase.id, adminId, "reject");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/guides");
  revalidatePath(`/admin/guides/${guideId}`);
}

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const view = resolveQueueView(resolvedSearchParams.view);
  const guides = await getGuideReviewQueue({ view });
  const emptyState =
    view === "drafts"
      ? "Нет черновиков анкет гидов."
      : "Нет анкет в очереди верификации.";
  const filterBaseClass =
    "rounded-full px-4 py-2 text-sm font-medium transition-colors";
  const filterInactiveClass =
    "border border-border/70 text-muted-foreground hover:bg-surface-low hover:text-foreground";
  const filterActiveClass = "bg-primary text-primary-foreground shadow-sm";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Проверка гидов
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          В основной очереди только анкеты со статусом «На проверке». Черновики
          и уже решённые заявки скрыты; для диагностики откройте «Черновики».
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Фильтр очереди гидов">
        <Link
          href="/admin/guides"
          aria-current={view === "all" ? "page" : undefined}
          className={`${filterBaseClass} ${
            view === "all" ? filterActiveClass : filterInactiveClass
          }`}
        >
          Все
        </Link>
        <Link
          href="/admin/guides?view=drafts"
          aria-current={view === "drafts" ? "page" : undefined}
          className={`${filterBaseClass} ${
            view === "drafts" ? filterActiveClass : filterInactiveClass
          }`}
        >
          Черновики
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/70 text-sm">
            <thead className="bg-surface-low text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Гид</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Регионы</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Отправлено</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {guides.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyState}
                  </td>
                </tr>
              ) : null}

              {guides.map((item) => {
                const displayName =
                  resolveDisplayName("guide", { full_name: item.account?.full_name }) ||
                  item.account?.email ||
                  "Без имени";

                return (
                  <tr key={item.profile.user_id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{displayName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.profile.languages.join(", ") || "Языки не указаны"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.account?.email ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.profile.regions.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={verificationBadgeVariant(
                          item.profile.verification_status,
                        )}
                      >
                        {verificationLabel(item.profile.verification_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(item.profile.updated_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="min-w-[120px]"
                        >
                          <Link href={`/admin/guides/${item.profile.user_id}`}>
                            Просмотреть
                          </Link>
                        </Button>
                        {item.profile.verification_status === "submitted" ? (
                          <>
                            <form
                              action={approveGuideAction.bind(
                                null,
                                item.profile.user_id,
                              )}
                            >
                              <Button
                                type="submit"
                                variant="secondary"
                                size="sm"
                                className="min-w-[120px] border-success/30 bg-success/10 text-success hover:bg-success/20"
                              >
                                Одобрить
                              </Button>
                            </form>
                            <form
                              action={rejectGuideAction.bind(
                                null,
                                item.profile.user_id,
                              )}
                            >
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                className="min-w-[120px]"
                              >
                                Отклонить
                              </Button>
                            </form>
                          </>
                        ) : null}
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
