import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Политика использования cookies",
    description:
      "Как Provodnik использует файлы cookie и аналогичные технологии на своей платформе.",
  };
}

const cookieTypes = [
  {
    name: "Обязательные cookies",
    desc: "Необходимы для входа в аккаунт, сохранения сессии и базовой работы платформы. Отключить их нельзя — без них сайт не будет работать корректно.",
    examples: "Сессионный токен авторизации, демо-режим",
  },
  {
    name: "Функциональные cookies",
    desc: "Помогают запоминать ваши предпочтения: язык, настройки интерфейса, последний просмотренный раздел.",
    examples: "Настройки отображения, выбранный регион",
  },
  {
    name: "Аналитические cookies",
    desc: "Используются для понимания того, как посетители взаимодействуют с сайтом. Данные анонимизированы и не идентифицируют конкретного пользователя.",
    examples: "Просмотры страниц, клики, время на сайте",
  },
];

export default function CookiesPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Технические правила
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Политика использования cookies
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Provodnik использует файлы cookie и аналогичные технологии для
            обеспечения корректной работы сервиса, сохранения настроек и
            базовой аналитики. Ниже описано, какие именно cookies мы
            применяем и зачем.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        {cookieTypes.map((type) => (
          <Card key={type.name} className="border-border/70 bg-card/80">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{type.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{type.desc}</p>
              <p>
                <span className="font-medium text-foreground">Примеры: </span>
                {type.examples}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Управление cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Вы можете ограничить или удалить cookies через настройки вашего
            браузера. Большинство браузеров позволяют блокировать cookies
            для определённых сайтов или удалять их вручную.
          </p>
          <p>
            Обратите внимание: отключение обязательных cookies может нарушить
            работу платформы — вход в аккаунт, бронирования и сообщения
            могут перестать функционировать.
          </p>
          <p>
            По вопросам, связанным с обработкой данных, пишите на{" "}
            <a
              href="mailto:support@provodnik.app"
              className="underline underline-offset-4"
            >
              support@provodnik.app
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
