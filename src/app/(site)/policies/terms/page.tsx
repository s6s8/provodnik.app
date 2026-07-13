import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Пользовательское соглашение",
    description:
      "Условия использования Provodnik для путешественников и гидов: правила работы маркетплейса, ограничения, споры и контакты.",
  };
}

const sections = [
  { id: "subject", label: "Предмет" },
  { id: "travelers", label: "Путешественники" },
  { id: "guides", label: "Гиды" },
  { id: "prohibited", label: "Запрещено" },
  { id: "liability", label: "Ответственность" },
  { id: "disputes", label: "Споры" },
  { id: "changes", label: "Изменения" },
  { id: "contacts", label: "Контакты" },
];

const travelerConditions = [
  "Путешественник обязан указывать достоверные контактные данные, состав группы, пожелания к маршруту и иные сведения, влияющие на исполнение заявки.",
  "До подтверждения бронирования путешественник самостоятельно проверяет программу тура, стоимость, ограничения по возрасту и здоровью, требования к документам и условия отмены.",
  "Путешественник несёт ответственность за своевременное прибытие к месту начала тура, наличие необходимых документов, соблюдение местных правил безопасности и миграционных требований.",
  "Если в поездке участвуют дети или иные третьи лица, разместивший заявку пользователь подтверждает, что действует с их согласия и вправе передавать сведения, необходимые для бронирования.",
];

const guideConditions = [
  "Гид размещает на платформе только достоверную информацию о себе, опыте, маршрутах, включённых услугах, ограничениях программы и стоимости.",
  "Гид обязан исполнять только те предложения, которые подтверждены им через платформу, и поддерживать актуальность календаря, доступности и цены.",
  "Гид самостоятельно организует оказание услуг, взаимодействие с подрядчиками, транспортом, размещением и иными участниками исполнения тура, если они предусмотрены программой.",
  "Гид обязуется оперативно сообщать о любых обстоятельствах, которые могут повлиять на проведение тура, включая погодные риски, ограничения доступа, болезни и форс-мажор.",
];

const prohibitedActions = [
  "Размещение заведомо ложной, неполной или вводящей в заблуждение информации о маршрутах, цене, опыте, документах и составе услуг.",
  "Попытки обойти платформу для заключения сделки после знакомства сторон через Provodnik, если это нарушает правила сервиса или права другой стороны.",
  "Использование сервиса для спама, сбора персональных данных без законного основания, мошенничества, угроз, дискриминации или иных незаконных действий.",
  "Публикация контента, нарушающего авторские права, права на изображение, требования законодательства РФ или права третьих лиц.",
  "Вмешательство в работу платформы, попытки взлома, автоматизированного сбора данных, обхода ограничений доступа или использования сервиса не по назначению.",
];

const disputeSteps = [
  "Сторона, обнаружившая проблему, должна сначала описать её через платформу или в поддержке, указав номер бронирования, дату тура и суть претензии.",
  "Мы вправе запросить переписку, скриншоты, фото, документы и иные материалы, относящиеся к спору. Срок ответа на такой запрос должен быть разумным.",
  "Платформа рассматривает спор как нейтральный посредник и принимает решение, исходя из подтверждённых фактов, условий бронирования и правил сервиса.",
  "Если спор не урегулирован в претензионном порядке, он подлежит разрешению в соответствии с законодательством Российской Федерации по месту нахождения оператора платформы, если иное не предусмотрено обязательными нормами права.",
];

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Правила сервиса"
        title="Пользовательское соглашение Provodnik"
        subtitle="Настоящее соглашение регулирует использование платформы Provodnik пользователями, которые ищут туры и экскурсии по России, а также гидами, размещающими свои предложения на платформе."
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

      <div className="flex flex-col gap-6">
        <Card id="subject" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">1. Предмет соглашения</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Provodnik предоставляет цифровую платформу, на которой
              путешественники могут публиковать запросы на поездки, находить
              экскурсии и связываться с гидами, а гиды могут размещать свои
              предложения, отвечать на запросы и организовывать туры.
            </p>
            <p>
              Платформа обеспечивает интерфейс для публикации информации,
              обмена сообщениями, оформления бронирований и поддержки спорных
              ситуаций. Мы не обещаем результат поиска, минимальный объём заказов
              или постоянную доступность конкретного гида.
            </p>
          </CardContent>
        </Card>

        <Card id="travelers" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              2. Условия использования для путешественников
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {travelerConditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="guides" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              3. Условия использования для гидов
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {guideConditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="prohibited" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">4. Запрещённые действия</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {prohibitedActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="liability" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              5. Ответственность платформы
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Provodnik является маркетплейсом и информационной платформой, а
              не туроператором, турагентом или перевозчиком. Мы не формируем
              маршрут от своего имени, не сопровождаем поездки и не оказываем
              услуги гида непосредственно.
            </p>
            <p>
              Ответственность за фактическое оказание услуг, соблюдение
              программы, безопасность маршрута, наличие лицензий и разрешений,
              если они обязательны, несёт гид.
            </p>
            <p>
              Мы не отвечаем за убытки, вызванные действиями третьих лиц,
              погодными условиями, транспортными сбоями, форс-мажором и иными
              обстоятельствами, находящимися вне разумного контроля платформы.
            </p>
          </CardContent>
        </Card>

        <Card id="disputes" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              6. Споры и разрешение конфликтов
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {disputeSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="changes" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">7. Изменение условий</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Мы вправе обновлять настоящее соглашение по мере развития сервиса,
              изменения законодательства или бизнес-процессов. Новая редакция
              вступает в силу с момента публикации на этой странице, если в самой
              редакции не указан иной срок.
            </p>
            <p>
              Продолжение использования платформы после публикации изменений
              означает согласие пользователя с новой редакцией условий.
            </p>
          </CardContent>
        </Card>

        <Card id="contacts" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">8. Контакты</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              По вопросам применения настоящего соглашения, споров, блокировок и
              правовых уведомлений пишите на{" "}
              <a
                href="mailto:support@provodnik.app"
                className="text-primary underline underline-offset-4"
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
