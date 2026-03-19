"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { GroupProgress } from "@/components/shared/group-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  listOpenRequests,
  type OpenRequestDetail,
} from "@/data/open-requests/local-store";
import { cn } from "@/lib/utils";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TravelerOpenRequestsScreen() {
  const [items, setItems] = React.useState<OpenRequestDetail[]>([]);

  const refresh = React.useCallback(() => {
    void (async () => {
      try {
        const next = await listOpenRequests();
        setItems(next);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    refresh();

    function handleStorage(event: StorageEvent) {
      if (event.key?.startsWith("provodnik.traveler.open-requests.") ?? false) {
        refresh();
      }
    }

    function handleFocus() {
      refresh();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Открытые группы
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Здесь появляются примеры групповых запросов на поездки. Можно
              присоединиться к группе — изменения пока сохраняются только на
              этом устройстве.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/traveler/requests">Мои запросы</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <OpenRequestCard key={item.record.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function OpenRequestCard({ item }: { item: OpenRequestDetail }) {

  const joinedLabel = item.isJoined ? "Вы в группе" : "Не в группе";
  const spotsLabel =
    item.record.group.openToMoreMembers && item.remainingSpots > 0
      ? `Осталось ${item.remainingSpots} мест`
      : "Набор в группу закрыт";

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {item.record.destinationLabel}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {item.record.dateRangeLabel}
            </p>
          </div>
          <Badge
            variant={item.isJoined ? "default" : "outline"}
            className={cn(!item.isJoined && "bg-background")}
          >
            {joinedLabel}
          </Badge>
        </div>

        <Separator />

        <GroupProgress
          current={item.record.group.sizeCurrent}
          target={item.record.group.sizeTarget}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{item.record.status}</Badge>
          <Badge variant="outline">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {item.record.group.sizeCurrent}/{item.record.group.sizeTarget}
            </span>
          </Badge>
          <Badge variant="outline">{spotsLabel}</Badge>
          {typeof item.record.budgetPerPersonRub === "number" ? (
            <Badge variant="outline">
              {formatRub(item.record.budgetPerPersonRub)} на человека
            </Badge>
          ) : null}
          <Badge variant="outline">{item.record.visibility}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <AvatarStack
              size="sm"
              items={item.roster.map((member) => ({
                id: member.id,
                label: member.displayName,
              }))}
            />
            {item.record.regionLabel ? (
              <p className="text-xs text-muted-foreground">{item.record.regionLabel}</p>
            ) : null}
          </div>
          <p className="text-xs font-medium text-muted-foreground">Особенности</p>
          <p className="mt-1 line-clamp-2 text-sm text-foreground">
            {item.record.highlights.join(" · ")}
          </p>
        </div>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href={`/traveler/open-requests/${item.record.id}`}>
            Подробнее
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
