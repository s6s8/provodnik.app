import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Политика возвратов",
  description:
    "Как и в каких случаях Provodnik возвращает деньги за экскурсии и туры в версии MVP.",
};

export default function RefundPolicyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Правила сервиса
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Возвраты: когда и сколько денег возвращается
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Эта политика описывает общий подход Provodnik к возвратам на этапе MVP.
            Финальные юридические формулировки могут отличаться, но принципы
            прозрачности и здравого смысла останутся такими же.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Когда возможен полный возврат</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Гид отменяет подтверждённое бронирование, и вы не соглашаетесь на
                предложенную замену или перенос.
              </li>
              <li>
                Фактическая поездка существенно расходится с подтверждённой программой
                (по ключевым точкам маршрута или формату).
              </li>
              <li>
                Заявка так и не была подтверждена или была отклонена — в таком случае
                собранные суммы возвращаются.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              Невозвратные расходы и частичный возврат
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Часть затрат гида может быть невозвратной: билеты, разрешения, заранее
              оплаченный транспорт. Если такие расходы были заранее и явно согласованы
              письменно, они могут вычитаться из суммы возврата.
            </p>
            <p>
              Цель Provodnik — избегать скрытых удержаний. Все списания должны быть
              понятны, привязаны к конкретному бронированию и по возможности
              подтверждены документами.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Как принимаются решения и сроки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Решения по возвратам принимаются на основе подтверждения бронирования,
              таймстемпов, переписки и информации, предоставленной в споре.
            </li>
            <li>
              После одобрения возврата деньги отправляются на исходный способ оплаты,
              когда это технически возможно. Сроки зачисления зависят от банка.
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
          <Link href="/trust">Как Provodnik работает с доверием</Link>
        </Button>
      </div>
    </div>
  );
}


