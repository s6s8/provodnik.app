"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTravelerRequestById } from "@/data/traveler-request/local-store";
import { GuideRequestDetailScreen } from "@/features/guide/components/requests/guide-request-detail-screen";

export function GuideRequestDetailRoute({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [record, setRecord] = React.useState<Awaited<
    ReturnType<typeof getTravelerRequestById>
  > | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const next = await getTravelerRequestById(requestId);
        if (!isMounted) return;
        setRecord(next);
        setHasError(false);
      } catch {
        if (!isMounted) return;
        setRecord(null);
        setHasError(true);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет гида</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Загрузка запроса…</CardTitle>
            <p className="text-sm text-muted-foreground">
              Подгружаем данные по запросу и предложениям.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет гида</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Запрос не найден</CardTitle>
            <p className="text-sm text-muted-foreground">
              {hasError
                ? "Не удалось загрузить данные. Проверьте, что запрос существует на этом устройстве."
                : "На этом устройстве нет запроса с таким идентификатором."}
            </p>
          </CardHeader>
          <CardContent>
            <Link
              href="/guide/requests"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Вернуться во входящие
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <GuideRequestDetailScreen record={record} />;
}

