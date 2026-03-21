import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Доверие",
  description:
    "Как Provodnik заботится о прозрачности цен, правилах отмены и безопасности бронирований.",
};

export default function TrustPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Правила сервиса
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Доверие к бронированию — до оплаты, во время поездки и после неё
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Provodnik — маркетплейс экскурсий и туров по России с бронированием по
            запросу. Описанные ниже принципы задают ожидаемое поведение сервиса в
            MVP‑версии и не являются окончательными юридическими условиями.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Что видит путешественник</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                До оплаты вы видите программу по шагам: длительность, точки маршрута,
                что включено в стоимость и где могут появиться дополнительные расходы.
              </li>
              <li>
                Цена и условия отмены привязаны к конкретному бронированию и
                подтверждаются письменно в интерфейсе. Если гид не может выполнить
                поездку, действует{" "}
                <Link
                  href="/policies/refunds"
                  className="underline underline-offset-4"
                >
                  политика возвратов
                </Link>
                .
              </li>
              <li>
                Никаких &laquo;подмен&raquo; без согласия: если меняется гид или формат
                экскурсии, вы можете согласиться на изменение или отказаться.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Что получает гид</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Заявки приходят с контекстом: даты, размер группы, бюджет и пожелания,
                чтобы можно было быстро предложить реалистичный маршрут.
              </li>
              <li>
                Правила отмены и возвратов заранее описаны в{" "}
                <Link
                  href="/policies/cancellation"
                  className="underline underline-offset-4"
                >
                  политике отмен
                </Link>{" "}
                и в самом бронировании, без скрытых пунктов мелким шрифтом.
              </li>
              <li>
                Споры рассматриваются по фактам: опираемся на письменные подтверждения,
                таймстемпы и историю действий по конкретному туру.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Границы ответственности (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Provodnik не заменяет визу, страховку, соблюдение миграционных правил и
              требований безопасности — за это всегда отвечает путешественник.
            </li>
            <li>
              Погода, инфраструктура и форс‑мажор могут влиять на маршрут. Гиды стараются
              предлагать разумные альтернативы и корректировки по договорённости.
            </li>
            <li>
              При расхождении ожиданий с реальностью основным источником правды считается
              письменное подтверждение бронирования.
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
          <Link href="/policies/cancellation">Подробнее об отменах и штрафах</Link>
        </Button>
      </div>
    </div>
  );
}


