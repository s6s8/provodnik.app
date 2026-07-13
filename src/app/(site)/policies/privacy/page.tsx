import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Политика конфиденциальности",
    description:
      "Как Provodnik собирает, использует, хранит и удаляет персональные данные пользователей платформы.",
  };
}

const sections = [
  { id: "operator", label: "Оператор" },
  { id: "collected", label: "Какие данные" },
  { id: "purposes", label: "Цели" },
  { id: "third-parties", label: "Третьи лица" },
  { id: "rights", label: "Права" },
  { id: "cookies", label: "Cookies" },
  { id: "contacts", label: "Контакты" },
];

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
    <div>
      <PageHeader
        eyebrow="Персональные данные"
        title="Политика конфиденциальности Provodnik"
        subtitle="Эта политика объясняет, какие данные мы собираем при использовании Provodnik, зачем они нужны, кому передаются и как пользователь может управлять своей информацией."
      />
      <p className="mt-1 text-xs text-on-surface-muted">Обновлено: 10 июня 2025 г.</p>

      <nav
        aria-label="Разделы"
        className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-4 mb-8"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex min-h-11 items-center py-3 text-sm text-primary hover:underline"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <Card id="operator" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              Сведения об операторе персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Оператором персональных данных в значении ст. 3 Федерального закона
              от 27.07.2006 № 152-ФЗ «О персональных данных» выступает команда
              проекта Provodnik (далее — «Оператор», «мы»). Контактный адрес для
              всех вопросов обработки персональных данных, отзыва согласия и
              направления обращений субъектов данных:{" "}
              <a
                href="mailto:support@provodnik.app"
                className="text-primary underline underline-offset-4"
              >
                support@provodnik.app
              </a>
              .
            </p>
            <p>
              <span className="font-medium text-foreground">Цели обработки:</span>{" "}
              организация маркетплейса частных гидов по России, регистрация и
              авторизация пользователей, оформление запросов и бронирований,
              поддержка переписки между путешественниками и гидами, рассмотрение
              обращений и обеспечение безопасности сервиса.
            </p>
            <p>
              <span className="font-medium text-foreground">Правовое основание:</span>{" "}
              согласие субъекта персональных данных (ст. 6 ч. 1 п. 1 152-ФЗ),
              исполнение договора с пользователем (ст. 6 ч. 1 п. 5 152-ФЗ) и
              законные интересы Оператора по обеспечению работы платформы.
            </p>
            <p>
              <span className="font-medium text-foreground">Статус проекта.</span>{" "}
              Provodnik находится на стадии запуска. До начала приёма
              платежей на платформе расчёты между путешественником и гидом
              ведутся напрямую без участия Provodnik. Полные регистрационные
              сведения оператора (ОГРНИП/ОГРН, ИНН, юридический адрес,
              наименование ИП или юридического лица, сведения о регистрации в
              Реестре операторов персональных данных Роскомнадзора) будут
              опубликованы на этой странице до момента запуска приёма платежей
              на платформе. Запросы на актуальные регистрационные данные можно
              направлять на{" "}
              <a
                href="mailto:support@provodnik.app"
                className="text-primary underline underline-offset-4"
              >
                support@provodnik.app
              </a>
              .
            </p>
            <p>
              <span className="font-medium text-foreground">
                Место обработки данных:
              </span>{" "}
              Российская Федерация. Хранение и обработка персональных данных
              граждан РФ осуществляется с использованием баз данных, размещённых
              на территории Российской Федерации, в соответствии с требованиями
              ч. 5 ст. 18 152-ФЗ.
            </p>
          </CardContent>
        </Card>

        <Card id="collected" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              1. Какие данные мы собираем
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {collectedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="purposes" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              2. Для чего мы используем данные
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {dataPurposes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="third-parties" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              3. Передача данных третьим лицам
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Мы передаём данные только в объёме, необходимом для работы
              платформы и законных целей её обслуживания.
            </p>
            <ul className="space-y-3 list-disc pl-5">
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

        <Card id="rights" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              4. Права пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {userRights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="cookies" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">5. Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
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

        <Card id="contacts" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle aria-level={2} className="text-base">
              6. Контакты по вопросам данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Запросы на доступ, удаление, экспорт данных и вопросы по обработке
              персональной информации можно направить на{" "}
              <a
                href="mailto:support@provodnik.app"
                className="text-primary underline underline-offset-4"
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
    </div>
  );
}
