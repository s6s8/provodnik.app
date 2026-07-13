import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Публичная оферта (проект)",
    description:
      "Проект публичной оферты «Проводник»: роль платформы как маркетплейса и технического посредника, распределение ответственности между гидом и путешественником, платежи, споры и ограничение ответственности.",
  };
}

const sections = [
  { id: "role", label: "Роль платформы" },
  { id: "contract", label: "Договор сторон" },
  { id: "guide", label: "Ответственность гида" },
  { id: "traveler", label: "Ответственность путешественника" },
  { id: "payments", label: "Платежи и возвраты" },
  { id: "disputes", label: "Споры" },
  { id: "liability", label: "Ограничение ответственности" },
  { id: "data", label: "Данные и приватность" },
  { id: "final", label: "Статус документа" },
];

const guideResponsibilities = [
  "Гид самостоятельно и от своего имени оказывает услуги экскурсии или тура: формирует маршрут, определяет программу, обеспечивает безопасность и качество услуги.",
  "Гид гарантирует, что вправе оказывать соответствующие услуги, и при необходимости имеет требуемые разрешения, аккредитации или статус (самозанятый, ИП, юридическое лицо).",
  "Гид отвечает за достоверность размещённой информации о цене, включённых услугах, ограничениях программы и условиях отмены.",
  "Гид несёт ответственность перед путешественником за фактическое исполнение обязательств по согласованному заказу.",
];

const travelerResponsibilities = [
  "Путешественник указывает достоверные данные о составе группы, датах, пожеланиях и иных сведениях, влияющих на исполнение заказа.",
  "Путешественник самостоятельно оценивает соответствие программы своим возможностям по здоровью, возрасту и физической подготовке до подтверждения заказа.",
  "Путешественник соблюдает согласованные с гидом условия, правила безопасности и требования законодательства в месте проведения поездки.",
  "Путешественник своевременно сообщает гиду и платформе о невозможности участия, изменениях состава группы или иных существенных обстоятельствах.",
];

const paymentTerms = [
  "Платформа может выступать техническим средством оформления заказа и, при подключении платёжного модуля, — агентом по приёму платежей в пользу гида. Порядок расчётов определяется отдельными условиями и применимым платёжным сервисом.",
  "Стоимость услуги, состав включённых услуг и условия отмены определяет гид и доводит их до путешественника до подтверждения заказа.",
  "Возвраты, переносы и удержания при отмене регулируются условиями конкретного заказа и гида, а также обязательными нормами законодательства о защите прав потребителей.",
  "Платформа не удерживает вознаграждение сверх раскрытых сервисных условий и не является выгодоприобретателем по договору оказания услуг между гидом и путешественником.",
];

const disputeSteps = [
  "Сторона, обнаружившая проблему, сначала описывает её через платформу или поддержку с указанием заказа, даты и сути претензии.",
  "Платформа как нейтральный посредник вправе запросить переписку, фотографии, документы и иные материалы и содействует урегулированию спора.",
  "Итоговая ответственность по спору о качестве или объёме услуги лежит на гиде как исполнителе; платформа не подменяет собой стороны договора.",
  "Неурегулированные споры разрешаются в соответствии с законодательством Российской Федерации.",
];

export default function OfferPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Правовые документы"
        title="Публичная оферта «Проводник»"
        subtitle="Документ описывает роль платформы «Проводник» как маркетплейса и технического посредника, а также распределение ответственности между гидами и путешественниками при заключении и исполнении заказов."
      />
      <p className="mt-1 text-xs text-on-surface-muted">
        Проект. Обновляется до запуска приёма платежей.
      </p>

      <Alert variant="warning" className="mt-6">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle className="text-sm font-semibold">
          Черновик — требуется финальная юридическая проверка
        </AlertTitle>
        <AlertDescription className="text-sm leading-[1.6] text-warning-text">
          Это предварительная редакция оферты. Она не является юридической
          консультацией и не заменяет проверку юристом. Итоговая редакция и
          обязывающие условия публикуются после согласования с профильным
          юристом и до начала приёма платежей на платформе.
        </AlertDescription>
      </Alert>

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
        <Card id="role" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">1. Роль платформы</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              «Проводник» — это маркетплейс и информационно-технический посредник.
              Платформа предоставляет цифровую среду, в которой путешественники
              публикуют запросы и находят гидов, а гиды размещают предложения,
              отвечают на запросы и оформляют заказы.
            </p>
            <p>
              Платформа не является туроператором, турагентом, перевозчиком или
              экскурсоводом и не оказывает услуги гида от своего имени. Договор
              на оказание услуги заключается напрямую между гидом и
              путешественником; платформа обеспечивает лишь техническую
              возможность их взаимодействия.
            </p>
          </CardContent>
        </Card>

        <Card id="contract" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              2. Прямой договор между гидом и путешественником
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              При подтверждении заказа договор возмездного оказания услуг
              заключается непосредственно между гидом (исполнителем) и
              путешественником (заказчиком). Условия договора формируются из
              согласованных сторонами параметров заказа: маршрута, даты, состава
              группы, цены и включённых услуг.
            </p>
            <p>
              Платформа не является стороной этого договора и не принимает на
              себя обязательств исполнителя или заказчика по нему.
            </p>
          </CardContent>
        </Card>

        <Card id="guide" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">3. Ответственность гида</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {guideResponsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="traveler" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              4. Ответственность путешественника
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {travelerResponsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="payments" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">5. Платежи и возвраты</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {paymentTerms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="disputes" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">6. Споры</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <ul className="flex flex-col gap-3 list-disc pl-5">
              {disputeSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="liability" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              7. Ограничение ответственности платформы
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Платформа как технический посредник не отвечает за качество,
              объём, безопасность и результат услуг, оказываемых гидом, а также
              за действия или бездействие пользователей.
            </p>
            <p>
              Платформа не отвечает за убытки, вызванные действиями третьих лиц,
              погодными условиями, транспортными сбоями, форс-мажором и иными
              обстоятельствами вне её разумного контроля. Ответственность
              платформы, если применимыми обязательными нормами не установлено
              иное, ограничивается размером фактически удержанного платформой
              сервисного вознаграждения по соответствующему заказу.
            </p>
          </CardContent>
        </Card>

        <Card id="data" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">
              8. Персональные данные и приватность
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Обработка персональных данных осуществляется в соответствии с{" "}
              <a
                href="/policies/privacy"
                className="text-primary underline underline-offset-4"
              >
                Политикой конфиденциальности
              </a>{" "}
              и{" "}
              <a
                href="/policies/terms"
                className="text-primary underline underline-offset-4"
              >
                Пользовательским соглашением
              </a>
              . Стороны обмениваются только теми данными, которые необходимы для
              оформления и исполнения заказа.
            </p>
          </CardContent>
        </Card>

        <Card id="final" className="border-border bg-card scroll-mt-24">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle aria-level={2} className="text-base">9. Статус документа</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base leading-[1.65] text-muted-foreground">
            <p>
              Настоящий документ является проектом и носит информационный
              характер. Обязывающая редакция публичной оферты вступает в силу
              после финальной юридической проверки и до запуска приёма платежей.
              По вопросам документа пишите на{" "}
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
