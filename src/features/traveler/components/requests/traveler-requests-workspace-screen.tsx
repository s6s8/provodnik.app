"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listOpenRequests } from "@/data/open-requests/local-store";
import {
  listOffersForTravelerRequest,
  listTravelerRequests,
} from "@/data/traveler-request/local-store";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { TravelerWorkspaceNav } from "@/features/traveler/components/shared/traveler-workspace-nav";

function pluralizeRu(value: number, [one, few, many]: [string, string, string]) {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function TravelerRequestsWorkspaceScreen() {
  const [requests, setRequests] = React.useState<TravelerRequestRecord[]>([]);
  const [joinedOpenRequestsCount, setJoinedOpenRequestsCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const nextRequests = await listTravelerRequests();
        const allOpenRequests = await listOpenRequests();
        const joined = allOpenRequests.filter((item) => item.isJoined).length;

        if (!isMounted) return;

        setRequests(nextRequests);
        setJoinedOpenRequestsCount(joined);
      } catch {
        if (!isMounted) return;
        setRequests([]);
        setJoinedOpenRequestsCount(0);
      }
    }

    void load();

    function handleStorage(event: StorageEvent) {
      const key = event.key ?? "";
      if (
        key.startsWith("provodnik.traveler.open-requests.") ||
        key === "provodnik.traveler.requests.v1"
      ) {
        void load();
      }
    }

    function handleFocus() {
      void load();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Мои запросы
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Здесь вы видите все свои запросы на поездки: новые, с откликами
              гидов и уже забронированные маршруты. Запросы сейчас сохраняются
              локально на этом устройстве.
            </p>
          </div>
          <TravelerWorkspaceNav
            joinedOpenRequestsCount={joinedOpenRequestsCount}
            includeListings
          />
        </div>
      </div>

      <div className="space-y-4">
        {joinedOpenRequestsCount > 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Групповые поездки</CardTitle>
              <p className="text-sm text-muted-foreground">
                Вы присоединились к {joinedOpenRequestsCount} открытым
                запросам-группам на этом устройстве.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/traveler/open-requests">Открытые группы</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {requests.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>У вас пока нет запросов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Оставьте первый запрос — и мы покажем, как могут отвечать
                гиды с разными программами и бюджетами.
              </p>
              <Button asChild>
                <Link href="/traveler/requests/new">
                  Создать запрос
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((item) => (
              <RequestCard key={item.id} record={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ record }: { record: TravelerRequestRecord }) {
  const offerCount = listOffersForTravelerRequest(record.id).length;
  const dateLabel = `${record.request.startDate} — ${record.request.endDate}`;
  const travelerLabel = pluralizeRu(record.request.groupSize, [
    "путешественник",
    "путешественника",
    "путешественников",
  ]);
  const offerLabel = pluralizeRu(offerCount, ["отклик", "отклика", "откликов"]);

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {record.request.destination}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <TravelerRequestStatusBadge status={record.status} />
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{record.request.experienceType}</Badge>
          <Badge variant="outline">
            {record.request.groupSize} {travelerLabel}
          </Badge>
          <Badge variant="outline">
            {offerCount === 0 ? "Нет откликов" : `${offerCount} ${offerLabel}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Обновлено {formatShortDate(record.updatedAt)}
        </p>
        <Button asChild variant="secondary">
          <Link href={`/traveler/requests/${record.id}`}>
            Открыть
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}
