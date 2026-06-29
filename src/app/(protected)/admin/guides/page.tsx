import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListRow } from "@/components/shared/list-row";
import { formatRussianDateTime } from "@/lib/dates";
import {
  ensureOpenModerationCase,
  getGuideReviewQueue,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";
import type {
  GuideReviewQueueItem,
  GuideReviewQueueView,
} from "@/lib/supabase/moderation";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

export const metadata: Metadata = {
  title: "Очередь верификации",
};

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

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function GuideQueueLoadError({ view }: { view: GuideReviewQueueView }) {
  const retryHref = view === "drafts" ? "/admin/guides?view=drafts" : "/admin/guides";
  return (
    <div
      role="alert"
      className="rounded-[1.75rem] border border-destructive/30 bg-destructive/10 p-6 shadow-card"
    >
      <p className="text-sm font-semibold text-destructive">
        Заявки гидов не загрузились
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Не удалось получить очередь анкет со статусом «На проверке». Заявка могла
        прийти, но список сейчас недоступен. Обновите страницу или проверьте
        черновики и журнал аудита.
      </p>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
        Если число рядом с «Гиды» в меню больше нуля, в системе есть заявки — но
        таблица очереди сейчас не открылась.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={retryHref}>Повторить загрузку</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/guides?view=drafts">Открыть черновики</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/audit">К аудиту</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">К панели</Link>
        </Button>
      </div>
    </div>
  );
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

  // A queue load failure must not collapse into the generic admin error
  // boundary ("Действие не выполнено") — that wrongly reads as a failed
  // approve/reject action and leaves the admin unable to tell whether an
  // application arrived. Catch here and render a queue-specific inline state
  // while keeping the page header + filters usable.
  let guides: GuideReviewQueueItem[] | null = null;
  try {
    guides = await getGuideReviewQueue({ view });
  } catch (error) {
    console.error("[AdminGuidesPage] guide queue load failed:", error);
  }
  const emptyState =
    view === "drafts"
      ? "Нет черновиков анкет гидов."
      : "Нет заявок на проверке. Если гид только начал анкету, проверьте вкладку «Черновики».";
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
          На проверке
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

      {guides === null ? (
        <GuideQueueLoadError view={view} />
      ) : guides.length === 0 ? (
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          {emptyState}
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((item) => {
            const displayName =
              resolveDisplayName("guide", { full_name: item.account?.full_name }) ||
              item.account?.email ||
              "Без имени";
            const languagesText =
              item.profile.languages.join(", ") || "Языки не указаны";
            const regionsText = item.profile.regions.join(", ") || "—";
            const isSubmitted = item.profile.verification_status === "submitted";

            return (
              <ListRow
                key={item.profile.user_id}
                leading={
                  <Avatar size="lg">
                    <AvatarImage src={item.account?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{avatarInitials(displayName)}</AvatarFallback>
                  </Avatar>
                }
                title={displayName}
                subtitle={
                  <>
                    <span className="block truncate">
                      {languagesText} · {regionsText}
                    </span>
                    <span className="block truncate text-xs">
                      {item.account?.email ?? "—"} · обновлено{" "}
                      {formatRussianDateTime(item.profile.updated_at)}
                    </span>
                  </>
                }
                badge={
                  <Badge
                    variant={verificationBadgeVariant(
                      item.profile.verification_status,
                    )}
                  >
                    {verificationLabel(item.profile.verification_status)}
                  </Badge>
                }
                actions={
                  <>
                    <Button asChild size="default">
                      <Link href={`/admin/guides/${item.profile.user_id}`}>
                        Проверить
                      </Link>
                    </Button>
                    {isSubmitted ? (
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
                            action={approveGuideAction.bind(
                              null,
                              item.profile.user_id,
                            )}
                          >
                            <DropdownMenuItem asChild>
                              <button
                                type="submit"
                                className="w-full cursor-pointer text-success focus:text-success"
                              >
                                Одобрить
                              </button>
                            </DropdownMenuItem>
                          </form>
                          <form
                            action={rejectGuideAction.bind(
                              null,
                              item.profile.user_id,
                            )}
                          >
                            <DropdownMenuItem asChild variant="destructive">
                              <button type="submit" className="w-full cursor-pointer">
                                Отклонить
                              </button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
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
