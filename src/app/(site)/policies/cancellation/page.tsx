import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Политика отмены",
    description:
      "Правила отмены туров и экскурсий в Provodnik: сроки, возвраты, форс-мажор и порядок отмены через платформу.",
  };
}

export default function CancellationPolicyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Правила сервиса
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Политика отмены бронирований
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Эти правила определяют, как рассчитывается возврат при отмене тура,
            в каких случаях заявка рассматривается индивидуально и как правильно
            инициировать отмену через Provodnik.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Сроки отмены и возврат</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Если отмена происходит за 7 календарных дней или раньше до даты
                начала тура, путешественнику возвращается 100% оплаченной суммы,
                если иное прямо не указано в подтверждении бронирования.
              </li>
              <li>
                Если отмена происходит в период от 3 до 7 календарных дней до
                начала тура, возвращается 50% оплаченной суммы.
              </li>
              <li>
                При отмене менее чем за 3 календарных дня до старта тура
                оплаченная сумма не возвращается, поскольку гид к этому моменту
                уже несёт организационные расходы и резервирует дату под
                конкретную группу.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Форс-мажор и особые случаи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              В ситуациях форс-мажора мы рассматриваем отмену индивидуально.
              К таким случаям могут относиться болезнь участника тура,
              стихийные бедствия, закрытие маршрута по решению властей, отмена
              транспорта или иные обстоятельства, которые сторона не могла
              разумно предотвратить.
            </p>
            <ul className="grid gap-2">
              <li>
                Для индивидуального рассмотрения мы вправе запросить документы,
                подтверждающие обстоятельства: медицинские справки, уведомления
                перевозчика, сообщения о закрытии маршрута и иные доказательства.
              </li>
              <li>
                Если отмена исходит от гида, и путешественник не принимает
                альтернативную дату или замену, возврат производится в полном
                объёме.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Как инициировать отмену</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Отмена должна инициироваться через платформу Provodnik из карточки
              бронирования или через обращение в поддержку, если нужная функция
              временно недоступна в интерфейсе.
            </li>
            <li>
              В обращении необходимо указать номер бронирования, причину отмены
              и, если применимо, приложить подтверждающие документы.
            </li>
            <li>
              Возврат, если он предусмотрен настоящей политикой, оформляется
              тем же способом оплаты, который использовался при бронировании,
              либо иным согласованным способом.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Для общих правил работы сервиса смотрите{" "}
            <Link href="/policies/terms" className="underline underline-offset-4">
              пользовательское соглашение
            </Link>
            , а для вопросов возврата средств в иных сценариях —{" "}
            <Link
              href="/policies/refunds"
              className="underline underline-offset-4"
            >
              политику возвратов
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
