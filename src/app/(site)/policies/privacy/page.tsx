import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Политика конфиденциальности",
    description:
      "Как Provodnik собирает, использует, хранит и удаляет персональные данные пользователей платформы.",
  };
}

const collectedData = [
  "Данные учётной записи: email, имя, фотография профиля, роль пользователя, сведения о себе и иные данные, которые вы добровольно добавляете в профиль.",
  "Данные бронирований и заявок: история запросов, бронирований, предложений, переписки по поездке, даты, маршруты, бюджет, количество участников.",
  "Технические данные: IP-адрес, cookie-файлы, сведения об устройстве, браузере, языковых настройках и действиях на платформе.",
];

const dataPurposes = [
  "Создание и поддержание учётной записи, авторизация, отображение профиля и обеспечение доступа к функциям платформы.",
  "Организация взаимодействия между путешественниками и гидами, оформление бронирований, уведомления об изменениях статуса и обработка обращений.",
  "Аналитика качества сервиса, предотвращение злоупотреблений, соблюдение требований закона и защита прав пользователей и платформы.",
];

const userRights = [
  "Запросить информацию о том, какие персональные данные мы обрабатываем и на каком основании.",
  "Попросить исправить неточные или устаревшие данные, если они стали неверными.",
  "Запросить удаление учётной записи и связанных данных, если у нас нет обязанности хранить их по закону или для защиты прав в споре.",
  "Запросить выгрузку основных данных профиля и истории бронирований в машиночитаемом виде, если такая выгрузка технически доступна.",
];

export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
          Персональные данные
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Политика конфиденциальности Provodnik
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Эта политика объясняет, какие данные мы собираем при использовании
            Provodnik, зачем они нужны, кому передаются и как пользователь может
            управлять своей информацией.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              1. Какие данные мы собираем
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              {collectedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              2. Для чего мы используем данные
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              {dataPurposes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">
            3. Передача данных третьим лицам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Мы передаём данные только в объёме, необходимом для работы
            платформы и законных целей её обслуживания.
          </p>
          <ul className="grid gap-2">
            <li>
              <span className="font-medium text-foreground">Supabase</span> —
              используется для хранения данных профиля, истории бронирований,
              сообщений и иной информации, необходимой для функционирования
              сервиса.
            </li>
            <li>
              <span className="font-medium text-foreground">Resend</span> —
              может использоваться для отправки служебных email-уведомлений,
              включая подтверждения, напоминания и сообщения поддержки.
            </li>
            <li>
              Мы можем раскрывать данные государственным органам, судам и иным
              лицам, если такая передача требуется по закону или необходима для
              защиты прав платформы и пользователей.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              4. Права пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              {userRights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">5. Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Мы используем cookie и аналогичные технологии для входа в
              учётную запись, сохранения пользовательских настроек, стабильной
              работы сайта и базовой аналитики.
            </p>
            <p>
              Пользователь может ограничить использование cookie через настройки
              браузера, однако в этом случае часть функций платформы может
              работать некорректно или стать недоступной.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">
            6. Контакты по вопросам данных
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Запросы на доступ, удаление, экспорт данных и вопросы по обработке
            персональной информации можно направить на{" "}
            <a
              href="mailto:support@provodnik.app"
              className="underline underline-offset-4"
            >
              support@provodnik.app
            </a>
            .
          </p>
          <p>
            При обращении укажите email, связанный с аккаунтом, и кратко опишите
            запрос, чтобы мы могли быстрее идентифицировать запись и ответить по
            существу.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
