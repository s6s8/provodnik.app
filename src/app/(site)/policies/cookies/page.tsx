import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Политика использования cookies",
    description:
      "Как Provodnik использует файлы cookie и аналогичные технологии на своей платформе.",
  };
}

const sections = [
  { id: "essential", label: "Обязательные" },
  { id: "functional", label: "Функциональные" },
  { id: "analytics", label: "Аналитические" },
  { id: "management", label: "Управление" },
];

const cookieTypes = [
  {
    id: "essential",
    name: "Обязательные cookies",
    desc: "Необходимы для входа в аккаунт, сохранения сессии и базовой работы платформы. Отключить их нельзя — без них сайт не будет работать корректно.",
    examples: "Сессионный токен авторизации, демо-режим",
  },
  {
    id: "functional",
    name: "Функциональные cookies",
    desc: "Помогают запоминать ваши предпочтения: язык, настройки интерфейса, последний просмотренный раздел.",
    examples: "Настройки отображения, выбранный регион",
  },
  {
    id: "analytics",
    name: "Аналитические cookies",
    desc: "Используются для понимания того, как посетители взаимодействуют с сайтом. Данные анонимизированы и не идентифицируют конкретного пользователя.",
    examples: "Просмотры страниц, клики, время на сайте",
  },
];

export default function CookiesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Технические правила"
        title="Политика использования cookies"
        subtitle="Provodnik использует файлы cookie и аналогичные технологии для обеспечения корректной работы сервиса, сохранения настроек и базовой аналитики. Ниже описано, какие именно cookies мы применяем и зачем."
      />
      <p className="mt-1 text-xs text-on-surface-muted">Обновлено: 10 июня 2025 г.</p>

      <nav
        aria-label="Разделы"
        className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-b border-border pb-4 mb-8"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="py-3 min-h-[44px] flex items-center text-sm text-primary hover:underline"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {cookieTypes.map((type) => (
          <Card key={type.name} id={type.id} className="border-border/70 bg-card/80 scroll-mt-24">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{type.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-[1.65] text-muted-foreground">
              <p>{type.desc}</p>
              <p>
                <span className="font-medium text-foreground">Примеры: </span>
                {type.examples}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card id="management" className="border-border/70 bg-card/80 scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Управление cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
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
    </div>
  );
}
