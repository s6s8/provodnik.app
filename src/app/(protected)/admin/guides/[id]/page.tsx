import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileAvatar } from "@/components/profile-avatar";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRussianDateRange,
  formatRussianDateTime,
  todayMoscowISODate,
} from "@/lib/dates";
import { GUIDE_TYPES } from "@/features/auth/guide-type";
import { getTheme } from "@/data/themes";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { listGuideListings } from "@/lib/supabase/admin-listings";
import { getGuideReviewDetail, requireAdminSession } from "@/lib/supabase/moderation";

import { GuideApprovalForm } from "./guide-approval-form";
import { GuideAvailabilityControl } from "./guide-availability-control";
import { GuideListingsPanel } from "./guide-listings-panel";

export const metadata: Metadata = {
  title: "Верификация гида",
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

const MODERATION_DECISION_LABELS: Record<string, string> = {
  approve: "Одобрено",
  reject: "Отклонено",
  request_changes: "Запрошены правки",
  hide: "Скрыто",
  restore: "Восстановлено",
};

function moderationDecisionLabel(decision: string) {
  return MODERATION_DECISION_LABELS[decision] ?? decision;
}

function specializationLabel(slug: string) {
  return getTheme(slug)?.label ?? slug;
}

function legalStatusLabel(status: string | null) {
  switch (status) {
    case "self_employed":
    case "self-employed":
      return "Самозанятый";
    case "individual_entrepreneur":
    case "ip":
      return "ИП";
    case "company":
    case "legal_entity":
      return "Юрлицо";
    default:
      return status ?? "—";
  }
}

export default async function AdminGuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getGuideReviewDetail(id);

  if (!detail) {
    notFound();
  }

  const { adminClient } = await requireAdminSession();
  const listings = await listGuideListings(adminClient, id);

  const displayName =
    resolveDisplayName("guide", { full_name: detail.account?.full_name }) ||
    detail.account?.email ||
    "Без имени";
  const today = todayMoscowISODate();
  const avatarProfile = {
    full_name: detail.account?.full_name ?? null,
    avatar_url: detail.account?.avatar_url ?? null,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProfileAvatar
          profile={avatarProfile}
          size={64}
          className="border border-border/70 text-xl text-foreground shadow-card"
        />
        <PageHeader
          className="flex-1"
          eyebrow="Очередь гидов"
          title={displayName}
          subtitle={detail.account?.email ?? "Email не указан"}
          actions={
            <Badge variant={verificationBadgeVariant(detail.profile.verification_status)}>
              {verificationLabel(detail.profile.verification_status)}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-ink-2">
                Описание
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {detail.profile.bio ?? "Гид пока не добавил описание."}
              </p>
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Имя в профиле
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.account?.full_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Тип гида
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {GUIDE_TYPES.find((t) => t.id === detail.profile.guide_type)?.label ?? "—"}
                </dd>
                <p className="mt-1 text-xs text-muted-foreground">
                  Формат работы (индивидуальный гид, агентство или команда) — не путать с правовым статусом ниже.
                </p>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Базовый город
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.base_city ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Стаж
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.years_experience ?? 0} лет
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Языки
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {Array.isArray(detail.profile.languages) && detail.profile.languages.length > 0
                    ? detail.profile.languages.join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Специализации
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {Array.isArray(detail.profile.specializations) && detail.profile.specializations.length > 0
                    ? detail.profile.specializations.map(specializationLabel).join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Регионы
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {Array.isArray(detail.profile.regions) && detail.profile.regions.length > 0
                    ? detail.profile.regions.join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Обновлено
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatRussianDateTime(detail.profile.updated_at)}
                </dd>
              </div>
            </dl>
            </CardContent>
          </Card>

          <GuideListingsPanel listings={listings} />

          <Card>
            <CardHeader>
              <CardTitle>Юридические данные</CardTitle>
            </CardHeader>
            <CardContent>
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Правовой статус
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {legalStatusLabel(detail.profile.legal_status)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  ИНН
                </dt>
                <dd className="mt-1 text-sm text-foreground font-mono">
                  {detail.profile.inn ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Страна документа
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.document_country ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-2">
                  Туроператор
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {detail.profile.is_tour_operator ? "Да" : "Нет"}
                  {detail.profile.is_tour_operator && detail.profile.tour_operator_registry_number ? (
                    <span className="ml-2 text-muted-foreground font-mono">
                      № {detail.profile.tour_operator_registry_number}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
            </CardContent>
          </Card>

          {detail.profile.verification_notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Заметки модератора</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {detail.profile.verification_notes}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Документ о квалификации</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {detail.licenses.length} шт.
                </span>
              </div>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col gap-3">
              {detail.licenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Пока нет добавленных документов о квалификации.
                </p>
              ) : null}

              {detail.licenses.map((license) => (
                <div
                  key={license.id}
                  className="rounded-card border border-border/70 bg-surface-low p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-foreground">
                        {license.licenseType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        № {license.licenseNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Выдано: {license.issuedBy}
                      </div>
                      {license.region ? (
                        <div className="text-xs text-muted-foreground">
                          Регион: {license.region}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {license.validUntil ? (
                        <>
                          <span>
                            Действует до {formatRussianDateRange(license.validUntil)}
                          </span>
                          {license.validUntil < today ? (
                            <Badge
                              variant="outline"
                              className="bg-destructive/10 text-destructive"
                            >
                              Просрочена
                            </Badge>
                          ) : null}
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-secondary/40 text-secondary-foreground"
                        >
                          Бессрочно
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Область:
                    </span>
                    {license.scopeMode === "all" ? (
                      <Badge variant="secondary">Все предложения</Badge>
                    ) : license.listingTitles.length > 0 ? (
                      license.listingTitles.map((title) => (
                        <Badge key={title} variant="outline">
                          {title}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Выбранные предложения</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Документы</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {detail.documents.length} шт.
                </span>
              </div>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col gap-3">
              {detail.documents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Документы еще не загружены.
                </div>
              ) : null}

              {detail.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-card border border-border/70 bg-surface-low p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {document.document_type}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Статус: {verificationLabel(document.status)} · Загружен{" "}
                      {formatRussianDateTime(document.created_at)}
                    </div>
                  </div>

                  {document.signed_url ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={document.signed_url} target="_blank" rel="noreferrer">
                        Скачать
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Ссылка недоступна
                    </span>
                  )}
                </div>
              ))}
            </div>
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-6">
          <Card className="border-primary/40 shadow-lift">
            <CardHeader>
              <CardTitle>Решение</CardTitle>
              <CardDescription>
                Зафиксируйте решение по анкете. Для отклонения и запроса
                документов можно добавить комментарий.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuideApprovalForm guideId={id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Доступность</CardTitle>
              <CardDescription>
                Приём новых заявок. Гид управляет этим сам, админ может
                переопределить. Не влияет на текущие бронирования и переписку.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuideAvailabilityControl
                guideId={id}
                available={detail.profile.is_available ?? false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История модерации</CardTitle>
            </CardHeader>
            <CardContent>
            {detail.moderation_case ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-card border border-border/70 bg-surface-low p-4">
                  <div className="text-sm font-medium text-foreground">
                    Причина очереди
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {detail.moderation_case.queue_reason}
                  </div>
                </div>

                {detail.moderation_case.actions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Действий по кейсу еще не было.
                  </div>
                ) : (
                  detail.moderation_case.actions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-card border border-border/70 bg-surface-low p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-foreground">
                          {moderationDecisionLabel(action.decision)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRussianDateTime(action.created_at)}
                        </div>
                      </div>
                      {action.note ? (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {action.note}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Кейс модерации еще не создан.
              </div>
            )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
