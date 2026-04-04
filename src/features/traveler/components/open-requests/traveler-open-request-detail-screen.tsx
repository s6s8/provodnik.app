"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getOpenRequestDetailFromSupabase,
  joinOpenRequestInSupabase,
  leaveOpenRequestInSupabase,
  type OpenRequestDetail,
} from "@/data/open-requests/supabase-client";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TravelerOpenRequestDetailScreen({
  openRequestId,
}: {
  openRequestId: string;
}) {
  const [detail, setDetail] = React.useState<OpenRequestDetail | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    void (async () => {
      const next = await getOpenRequestDetailFromSupabase(openRequestId);
      setDetail(next);
    })();
  }, [openRequestId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleJoin() {
    setMessage(null);
    try {
      await joinOpenRequestInSupabase(openRequestId);
    } catch {
      setMessage("Не удалось присоединиться к группе.");
    }
    refresh();
  }

  async function handleLeave() {
    setMessage(null);
    try {
      await leaveOpenRequestInSupabase(openRequestId);
    } catch {
      setMessage("Не удалось выйти из группы.");
    }
    refresh();
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Группа не найдена</CardTitle>
            <p className="text-sm text-muted-foreground">
              Такой групповой запрос в текущем списке не найден на этом устройстве.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/traveler/open-requests">
                <ArrowLeft className="size-4" />
                К списку групп
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const record = detail.record;
  const rosterCount = detail.roster.length;
  const canJoin =
    !detail.isJoined && record.group.openToMoreMembers && detail.remainingSpots > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/traveler/open-requests">
              <ArrowLeft className="size-4" />
              Открытые группы
            </Link>
          </Button>
          <Badge variant={detail.isJoined ? "default" : "outline"}>
            {detail.isJoined ? "Вы в группе" : "Не в группе"}
          </Badge>
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.destinationLabel}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {record.dateRangeLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              {record.group.sizeCurrent}/{record.group.sizeTarget} участник
              {record.group.sizeTarget === 1 ? "" : "ов"} · осталось{" "}
              {detail.remainingSpots} мест
            </span>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>О группе</CardTitle>
          <p className="text-sm text-muted-foreground">
            Демо-режим: действия с группой сейчас меняют данные только на этом устройстве.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{record.status}</Badge>
            <Badge variant="outline">{record.visibility}</Badge>
            <Badge variant="outline">
              Обновлено {formatShortDateTime(record.updatedAt)}
            </Badge>
            {typeof detail.economics.budgetPerPersonRub === "number" ? (
              <Badge variant="outline">
                Бюджет {formatRub(detail.economics.budgetPerPersonRub)} на человека
              </Badge>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Особенности</p>
            <ul className="grid gap-2 text-sm text-foreground">
              {record.highlights.map((item) => (
                <li key={item} className="rounded-md border border-border/70 p-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Свободные места</p>
              <p className="mt-1 text-sm text-foreground">
                {record.group.openToMoreMembers && detail.remainingSpots > 0
                  ? `Осталось ${detail.remainingSpots} мест`
                  : "Набор в группу закрыт"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">
                Примерный бюджет группы
              </p>
              <p className="mt-1 text-sm text-foreground">
                {typeof detail.economics.estimatedTotalCurrentRub === "number"
                  ? `~${formatRub(detail.economics.estimatedTotalCurrentRub)} при текущем составе`
                  : "Оценка бюджета не указана"}
              </p>
              {typeof detail.economics.estimatedTotalAtTargetRub === "number" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  ~{formatRub(detail.economics.estimatedTotalAtTargetRub)} при целевом размере группы
                </p>
              ) : null}
            </div>
          </div>

          {message ? (
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-sm text-foreground">{message}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            {detail.isJoined ? (
              <Button type="button" variant="outline" onClick={handleLeave}>
                Выйти из группы
              </Button>
            ) : (
              <Button type="button" onClick={handleJoin} disabled={!canJoin}>
                Присоединиться к группе
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href={`/traveler/requests/${record.travelerRequestId}`}>
                Открыть исходный запрос
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Состав группы</CardTitle>
          <p className="text-sm text-muted-foreground">
            В группе {rosterCount} участник
            {rosterCount === 1 ? "" : "а"}.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.roster.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-border/70 bg-background/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {member.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    В группе с {formatShortDateTime(member.joinedAt)}
                  </p>
                </div>
                <Badge variant={member.role === "organizer" ? "secondary" : "outline"}>
                  {member.role === "organizer" ? "Организатор" : "Участник"}
                </Badge>
              </div>
              {member.note ? (
                <p className="mt-2 text-sm text-muted-foreground">{member.note}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

