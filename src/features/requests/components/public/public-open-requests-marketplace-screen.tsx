 "use client";

import Link from "next/link";

import { useMemo, useState } from "react";

import { MapPinned, SlidersHorizontal, Users } from "lucide-react";

import { MarketplaceRequestCard } from "@/components/shared/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listLocalCreatedOpenRequests } from "@/data/open-requests/local-store";
import type { OpenRequestRecord } from "@/data/open-requests/types";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  requests: OpenRequestRecord[];
};

export function PublicOpenRequestsMarketplaceScreen({ requests }: Props) {
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "public" | "invite_only"
  >("all");
  const [localCreated] = useState<OpenRequestRecord[]>(() =>
    listLocalCreatedOpenRequests(),
  );

  const merged = useMemo(() => {
    const unique = new Map<string, OpenRequestRecord>();
    for (const item of [...localCreated, ...requests]) unique.set(item.id, item);
    return [...unique.values()];
  }, [localCreated, requests]);

  const localIds = useMemo(() => new Set(localCreated.map((item) => item.id)), [
    localCreated,
  ]);

  const filtered = useMemo(() => {
    if (visibilityFilter === "all") return merged;
    return merged.filter((item) => item.visibility === visibilityFilter);
  }, [merged, visibilityFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [filtered],
  );

  return (
    <div className="space-y-8">
      <section className="section-frame overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MapPinned className="size-4 text-primary" />
              Доска запросов
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Публичные запросы на поездки, к которым можно присоединиться.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              На этой доске собраны живые запросы на поездки: куда, в какие даты и с
              каким бюджетом люди ищут компанию и гида. Это точка входа в маркетплейс
              по спросу, а не только по готовым маршрутам.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Формирование групп
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Совместные поездки
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Запрос‑первый вход
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.8rem] border border-border/70 bg-white/78 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Сейчас на доске
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {merged.length}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Примеров групповых запросов для демонстрации витрины спроса без
                привязки к бэкенду — плюс запросы, которые вы создали на этом
                устройстве.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-border/70 bg-white/78 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Для кого эта страница
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Для путешественников и гидов, которые начинают с запроса
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Можно быстро оценить, какие поездки ищут сейчас, и перейти к
                оформлению запроса или входу в кабинет.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Фильтры доски</p>
            <p className="text-sm text-muted-foreground">
              Переключайте публичные и приватные (по приглашению) запросы.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-2 py-1 text-xs text-muted-foreground">
          <Button
            type="button"
            variant={visibilityFilter === "all" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-3"
            onClick={() => setVisibilityFilter("all")}
          >
            Все
          </Button>
          <Button
            type="button"
            variant={visibilityFilter === "public" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-3"
            onClick={() => setVisibilityFilter("public")}
          >
            Публичные
          </Button>
          <Button
            type="button"
            variant={visibilityFilter === "invite_only" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-3"
            onClick={() => setVisibilityFilter("invite_only")}
          >
            По приглашению
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Найдено запросов</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {sorted.length}
            </h2>
          </div>
          <div className="rounded-full border border-border/70 bg-white/74 px-4 py-2 text-sm text-muted-foreground">
            Сортировка: сначала самые свежие по активности
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((item) => (
            <OpenRequestMarketplaceCard
              key={item.id}
              item={item}
              isLocalCreated={localIds.has(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function OpenRequestMarketplaceCard({
  item,
  isLocalCreated,
}: {
  item: OpenRequestRecord;
  isLocalCreated: boolean;
}) {
  const remainingSpots = Math.max(
    0,
    Math.min(item.group.sizeTarget, item.group.sizeTarget - item.group.sizeCurrent),
  );

  const spotsLabel =
    item.group.openToMoreMembers && remainingSpots > 0
      ? `Осталось ${remainingSpots} мест`
      : "Набор в группу закрыт";

  return (
    <MarketplaceRequestCard
      title={item.destinationLabel}
      subtitle={item.dateRangeLabel}
      badgeLabel={item.visibility === "public" ? "Публичный запрос" : "По приглашению"}
      badgeVariant={item.visibility === "public" ? "secondary" : "outline"}
      meta={[
        {
          icon: Users,
          label: `Группа ${item.group.sizeCurrent}/${item.group.sizeTarget}`,
        },
        { label: spotsLabel },
      ]}
      highlights={item.highlights.join(" · ")}
      footerLeft={
        <div className="space-y-2">
          {isLocalCreated ? (
            <Badge className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
              Ваш запрос
            </Badge>
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Бюджет
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {typeof item.budgetPerPersonRub === "number"
                ? `${formatRub(item.budgetPerPersonRub)} на человека`
                : "По договорённости"}
            </p>
          </div>
        </div>
      }
      footerRight={
        <Button asChild variant="secondary">
          <Link href="/requests/new">Оставить такой же запрос</Link>
        </Button>
      }
    />
  );
}

