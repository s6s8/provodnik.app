import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Политика отмен",
  description:
    "Как работают отмены экскурсий и туров в Provodnik в версии MVP и какие последствия по платежам.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Правила сервиса
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Отмена бронирования: что происходит с деньгами и маршрутом
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Этот текст описывает логику отмен в Provodnik на этапе MVP. Он помогает
            понимать, чего ожидать при переносе или отмене поездки, но не заменяет
            полноценные юридические документы.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">До подтверждения бронирования</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Заявка — это ещё не бронирование. Пока гид не подтвердил поездку,
                любая сторона может отказаться без штрафов.
              </li>
              <li>
                Если в будущем появится опция предоплаты на этапе заявки, она будет
                подчиняться{" "}
                <Link
                  href="/policies/refunds"
                  className="underline underline-offset-4"
                >
                  политике возвратов
                </Link>
                .
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">После подтверждения бронирования</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Итог по отмене зависит от срока до начала поездки и невозвратных затрат
              (билеты, разрешения, заранее оплаченный транспорт). Базой для решения
              служит письменное подтверждение бронирования.
            </p>
            <ul className="grid gap-2">
              <li>
                Отмена со стороны путешественника: цель — вернуть всё, что можно
                разумно вернуть, за вычетом заранее согласованных невозвратных расходов.
              </li>
              <li>
                Отмена со стороны гида: путешественник в общем случае имеет право на
                полный возврат оплаченной суммы, если не выбирает предложенную
                альтернативу.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Как отменить поездку</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Используйте кнопку отмены в том разделе, где ведётся бронирование
              (кабинет путешественника или гида). Если такой опции временно нет, напишите
              в поддержку.
            </li>
            <li>
              Коротко опишите причину отмены и приложите важные детали (например, смену
              рейса или отмену поезда) — это ускорит рассмотрение.
            </li>
            <li>
              Когда отмена предполагает возврат средств, он происходит по{" "}
              <Link
                href="/policies/refunds"
                className="underline underline-offset-4"
              >
                политике возвратов
              </Link>
              .
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Последнее обновление: март 2026.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="sm">
          <Link href="/listings">Смотреть экскурсии</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/policies/refunds">Как устроены возвраты</Link>
        </Button>
      </div>
    </div>
  );
}


