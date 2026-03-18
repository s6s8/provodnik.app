import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketplaceInfoTile, MarketplaceOfferCard } from "@/components/shared/marketplace";
import type { OpenRequestGroupRosterMember } from "@/data/open-requests/types";
import { getSeededPublicRequestDetail } from "@/lib/seeded-marketplace/public-request-detail";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRoleLabel(role: OpenRequestGroupRosterMember["role"]) {
  return role === "organizer" ? "Организатор" : "Участник";
}

export const metadata: Metadata = {
  title: "Запрос",
  description:
    "Публичная страница запроса: формирование группы, детали и пространство для предложений гидов.",
};

export default function PublicRequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const detail = getSeededPublicRequestDetail(params.requestId);
  if (!detail) notFound();

  const { request, roster, offers } = detail;
  const remaining = Math.max(
    0,
    Math.min(request.group.sizeTarget, request.group.sizeTarget - request.group.sizeCurrent),
  );

  const visibilityLabel =
    request.visibility === "public" ? "Публичный запрос" : "По приглашению";

  const statusLabel =
    request.status === "open"
      ? "Открыт"
      : request.status === "forming_group"
        ? "Формируется группа"
        : request.status === "matched"
          ? "Найден гид"
          : "Закрыт";

  return (
    <div className="space-y-8">
      <section className="section-frame overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={request.visibility === "public" ? "secondary" : "outline"}>
                {visibilityLabel}
              </Badge>
              <Badge variant="outline">{statusLabel}</Badge>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {request.destinationLabel}
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              {request.dateRangeLabel} · Группа {request.group.sizeCurrent}/
              {request.group.sizeTarget}
              {request.group.openToMoreMembers && remaining > 0
                ? ` · осталось ${remaining} мест`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="rounded-full">
              <Link href="/auth">Оставить предложение гида</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/requests">Ко всем запросам</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)] lg:items-start">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardTitle>Коротко о запросе</CardTitle>
              <p className="text-sm text-muted-foreground">
                Запрос — точка входа в переговоры и формирование группы. Дальше здесь
                появятся предложения гидов и согласование условий.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MarketplaceInfoTile label="Направление" value={request.destinationLabel} />
                <MarketplaceInfoTile label="Даты" value={request.dateRangeLabel} />
                <MarketplaceInfoTile
                  label="Статус"
                  value={statusLabel}
                />
                <MarketplaceInfoTile
                  label="Бюджет"
                  value={
                    typeof request.budgetPerPersonRub === "number"
                      ? `${formatRub(request.budgetPerPersonRub)} / человек`
                      : "По договорённости"
                  }
                />
              </div>

              {request.highlights.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Пожелания и акценты
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {request.highlights.map((item) => (
                      <Badge key={item} variant="outline" className="bg-background/60">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardTitle>Предложения гидов</CardTitle>
              <p className="text-sm text-muted-foreground">
                Сравните ответы гидов: стоимость, включения и стиль программы.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              {offers.length ? (
                offers.map((offer) => (
                  <MarketplaceOfferCard
                    key={offer.id}
                    guideName={offer.guide.name}
                    guideMeta={`★ ${offer.guide.rating} · ${offer.guide.completedTrips} trips · ~${offer.guide.responseTimeHours}h response`}
                    statusLabel={
                      offer.status === "shortlisted"
                        ? "Shortlisted"
                        : offer.status === "new"
                          ? "New"
                          : offer.status
                    }
                    priceLabel={`${formatRub(offer.priceTotalRub)} total`}
                    durationLabel={`${offer.durationDays} days`}
                    highlights={offer.highlights}
                    included={offer.included}
                    message={offer.message}
                    footerLeft={
                      <p className="text-xs text-muted-foreground">
                        Group {offer.groupSizeMin}–{offer.groupSizeMax}
                      </p>
                    }
                    footerRight={
                      <Button asChild size="sm" className="rounded-full">
                        <Link href="/auth">Открыть и ответить</Link>
                      </Button>
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока нет предложений — гиды увидят запрос и смогут откликнуться.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Участники группы
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Сейчас в группе {request.group.sizeCurrent} из {request.group.sizeTarget}.
                Это демо-данные для витрины.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3">
              {roster.length ? (
                <div className="grid gap-2">
                  {roster.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-border/70 bg-background/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{member.displayName}</p>
                        <Badge variant="secondary">{getRoleLabel(member.role)}</Badge>
                      </div>
                      {member.note ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {member.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока нет данных об участниках.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Что можно сделать</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full rounded-full">
                <Link href="/auth">Войти и откликнуться как гид</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/requests/new">Создать свой запрос</Link>
              </Button>
              <p className="text-xs leading-6 text-muted-foreground">
                Сейчас это демо-страница. Действия ведут в профиль, где позже появится
                реальная отправка отклика и переговоры.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
