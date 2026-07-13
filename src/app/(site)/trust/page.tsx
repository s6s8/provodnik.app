import type { Metadata } from "next";
import Link from "next/link";

import { InfoHero, InfoPageShell } from "@/components/shared/info-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Доверие и безопасность",
    description:
      "Как Provodnik задаёт прозрачность договорённостей и безопасность поездок.",
  };
}

export default function TrustPage() {
  return (
    <InfoPageShell width="wide">
      <div className="flex flex-col gap-10">
        <InfoHero
          eyebrow="Правила сервиса"
          title="Доверие к бронированию — до оплаты, во время поездки и после неё"
          className="mb-6"
          subtitle={
            <>
              Provodnik — маркетплейс экскурсий по России с бронированием по запросу.
              Описанные ниже принципы определяют, как сервис защищает договорённости
              между путешественником и гидом. Полные условия использования — в{" "}
              <Link href="/policies/terms" className="text-primary underline underline-offset-2">
                пользовательском соглашении
              </Link>
              .
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle aria-level={2} className="text-base">Что видит путешественник</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-base text-ink-2">
              <ul className="grid list-disc gap-2 pl-5">
                <li>
                  До подтверждения брони вы видите программу по шагам: длительность,
                  точки маршрута, что включено в стоимость и где могут появиться
                  дополнительные расходы.
                </li>
                <li>
                  Цена и условия поездки фиксируются письменно в чате с гидом.
                </li>
                <li>
                  Договорённости видны обеим сторонам и таймстемпуются — это та
                  «правда», на которую опирается платформа при разногласиях.
                </li>
                <li>
                  Никаких &laquo;подмен&raquo; без согласия: если меняется гид или формат
                  экскурсии, вы можете согласиться на изменение или отказаться.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle aria-level={2} className="text-base">Что получает гид</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-base text-ink-2">
              <ul className="grid list-disc gap-2 pl-5">
                <li>
                  Заявки приходят с контекстом: даты, размер группы, бюджет и пожелания,
                  чтобы можно было быстро предложить реалистичный маршрут.
                </li>
                <li>
                  Условия — даты, цена, маршрут — фиксируются письменно в чате с
                  путешественником, без устных договорённостей задним числом.
                </li>
                <li>
                  То, что не зафиксировано в переписке, в спорах не учитывается.
                </li>
                <li>
                  Споры рассматриваются по фактам: опираемся на письменные подтверждения,
                  таймстемпы и историю действий по конкретной экскурсии.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">Границы ответственности</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-base text-ink-2">
            <ul className="grid list-disc gap-2 pl-5">
              <li>
                Provodnik не заменяет визу, страховку, соблюдение миграционных правил и
                требований безопасности — за это всегда отвечает путешественник.
              </li>
              <li>
                Погода, инфраструктура и форс‑мажор могут влиять на маршрут.
              </li>
              <li>
                Гиды стараются предлагать разумные альтернативы и корректировки по договорённости.
              </li>
              <li>
                При расхождении ожиданий с реальностью основным источником правды считается
                письменное подтверждение бронирования.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">Последнее обновление: март 2026.</p>
          </CardContent>
        </Card>

        <div>
          <Button asChild size="lg">
            <Link href="/guides">Смотреть гидов</Link>
          </Button>
        </div>
      </div>
    </InfoPageShell>
  );
}
