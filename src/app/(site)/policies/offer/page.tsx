import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateMetadata(): Metadata {
  return {
    title: "Публичная оферта",
    description:
      "Публичная оферта Provodnik: платформа как информационный посредник, гид-организатор как исполнитель тура, распределение ответственности за жизнь и здоровье участников.",
  };
}

const sections = [
  { id: "terms", label: "Термины" },
  { id: "subject", label: "Предмет" },
  { id: "platform-role", label: "Роль платформы" },
  { id: "guide-liability", label: "Ответственность гида" },
  { id: "traveler", label: "Путешественник" },
  { id: "safety", label: "Безопасность" },
  { id: "payments", label: "Оплата" },
  { id: "disputes", label: "Претензии" },
  { id: "acceptance", label: "Акцепт" },
  { id: "requisites", label: "Реквизиты" },
];

const guideLiability = [
  "Гид-организатор является исполнителем услуг по договору с путешественником и несёт полную ответственность за формирование программы, её безопасное проведение, соблюдение маршрута, времени и заявленного состава услуг.",
  "Гид самостоятельно обеспечивает наличие всех обязательных по законодательству РФ аттестаций, аккредитаций, лицензий и разрешений, необходимых для проведения экскурсии или тура, включая допуски на объекты и особо охраняемые природные территории.",
  "Гид отвечает за жизнь и здоровье участников во время оказания услуги, за инструктаж по технике безопасности, за оценку погодных, водных, горных и иных рисков и за отказ от проведения тура при возникновении угрозы безопасности.",
  "Гид самостоятельно привлекает и отвечает за действия любых подрядчиков (транспорт, размещение, снаряжение, инструкторы) и обеспечивает их соответствие требованиям безопасности.",
  "Гид обязан иметь действующие договоры страхования, если они обязательны для соответствующего вида деятельности, и предоставлять участникам достоверную информацию об ограничениях по возрасту и состоянию здоровья.",
];

const platformRole = [
  "Provodnik предоставляет информационную платформу (маркетплейс) для размещения запросов путешественников и предложений гидов, обмена сообщениями и оформления договорённостей между сторонами.",
  "Provodnik не является туроператором, турагентом, перевозчиком, экскурсионным бюро или организатором путешествий и не оказывает услуги гида от своего имени.",
  "Provodnik не формирует туристский продукт, не сопровождает поездки и не принимает на себя обязательств по безопасному проведению экскурсий и туров — эти обязательства несёт гид-организатор.",
  "Ответственность платформы ограничивается надлежащим функционированием сервиса и не распространяется на убытки, вред жизни, здоровью или имуществу, возникшие при фактическом оказании услуг гидом или третьими лицами.",
];

const travelerConditions = [
  "Путешественник указывает достоверные сведения о составе группы, датах, пожеланиях и обстоятельствах, влияющих на безопасность (возраст, состояние здоровья, ограничения).",
  "До подтверждения бронирования путешественник самостоятельно оценивает программу, её сложность, требования к подготовке, документам и снаряжению, а также условия отмены.",
  "Путешественник соблюдает указания гида по технике безопасности во время тура и правила посещаемых объектов и территорий.",
];

const disputeSteps = [
  "Претензия направляется через платформу или в поддержку с указанием тура, даты и сути требования; платформа выступает нейтральным посредником при её рассмотрении.",
  "Требования, связанные с качеством и безопасностью фактически оказанной услуги, вредом жизни, здоровью или имуществу, предъявляются непосредственно гиду-организатору как исполнителю.",
  "Неурегулированные споры разрешаются в соответствии с законодательством Российской Федерации.",
];

export default function OfferPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Правила сервиса"
        title="Публичная оферта Provodnik"
        subtitle="Настоящая оферта определяет условия использования платформы Provodnik и распределение ответственности между платформой, гидом-организатором и путешественником при организации экскурсий и туров."
      />
      <p className="mt-1 text-xs text-on-surface-muted">
        Редакция подготовлена как проект. Обновлено: 1 июля 2026 г.
      </p>

      <div className="mt-6 rounded-card border border-warning/40 bg-warning/10 p-4 text-sm leading-[1.6] text-foreground">
        <strong className="block">Черновик — требуется юридическая экспертиза.</strong>
        Текст является рабочим проектом и подлежит проверке юристом до придания
        ему силы публичной оферты и до запуска приёма платежей на платформе.
        Регистрационные сведения оператора и порядок расчётов дорабатываются.
      </div>

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
        <Card id="terms" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">1. Термины</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              <strong className="text-foreground">Платформа (Provodnik)</strong> —
              информационный посредник, обеспечивающий взаимодействие сторон.
            </p>
            <p>
              <strong className="text-foreground">Гид-организатор</strong> —
              физическое или юридическое лицо (индивидуальный гид, представитель
              агентства или команды гидов), которое размещает предложения и
              оказывает услуги по проведению экскурсий и туров.
            </p>
            <p>
              <strong className="text-foreground">Путешественник</strong> —
              пользователь, который публикует запрос и приобретает услуги гида.
            </p>
          </CardContent>
        </Card>

        <Card id="subject" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">2. Предмет оферты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              Платформа предоставляет доступ к сервису, в котором путешественник и
              гид-организатор самостоятельно заключают договор об оказании
              экскурсионных или туристских услуг. Договор об оказании услуг
              заключается напрямую между путешественником и гидом-организатором;
              платформа стороной такого договора не является.
            </p>
          </CardContent>
        </Card>

        <Card id="platform-role" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">3. Роль и ответственность платформы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {platformRole.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="guide-liability" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              4. Ответственность гида-организатора
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {guideLiability.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="traveler" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">5. Обязанности путешественника</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {travelerConditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="safety" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">
              6. Безопасность и распределение ответственности
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              Ответственность за жизнь, здоровье и безопасность участников во
              время фактического оказания услуги несёт гид-организатор как
              исполнитель. Платформа не осуществляет оперативный контроль за
              проведением туров и не отвечает за вред, причинённый при их
              исполнении.
            </p>
            <p>
              Гид-организатор обязан отказаться от проведения тура или изменить
              программу при возникновении угрозы безопасности, включая погодные,
              водные, горные и иные природные риски, и обеспечить участников
              необходимым инструктажем.
            </p>
          </CardContent>
        </Card>

        <Card id="payments" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">7. Оплата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              Порядок расчётов между путешественником и гидом-организатором,
              условия приёма платежей на платформе, комиссии и возвраты
              определяются отдельно и дорабатываются до запуска платёжного
              функционала. До этого момента расчёты производятся сторонами
              самостоятельно.
            </p>
          </CardContent>
        </Card>

        <Card id="disputes" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">8. Претензии и споры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <ul className="space-y-3 list-disc pl-5">
              {disputeSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="acceptance" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">9. Акцепт и изменения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              Использование платформы означает согласие с настоящей офертой в
              действующей редакции. Платформа вправе обновлять оферту; новая
              редакция вступает в силу с момента публикации на этой странице.
            </p>
          </CardContent>
        </Card>

        <Card id="requisites" className="border-border bg-card scroll-mt-24">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">10. Реквизиты и контакты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-[1.65] text-muted-foreground">
            <p>
              Полные регистрационные сведения оператора платформы (ОГРН/ОГРНИП,
              ИНН, юридический адрес) публикуются до запуска приёма платежей. По
              вопросам применения оферты пишите на{" "}
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
