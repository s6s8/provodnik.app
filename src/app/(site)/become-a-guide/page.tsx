import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, MessageSquareText, ShieldCheck } from "lucide-react";

import { InfoHero, InfoPageShell, InfoSection } from "@/components/shared/info-shell";
import { StepCard } from "@/components/shared/step-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const STEPS = [
  {
    title: "Расскажите о себе",
    description: "Опыт, языки, города и маршруты, ссылки и документы.",
  },
  {
    title: "Подтвердите уровень",
    description: "Команда смотрит профиль вручную — так в сервис попадают только сильные гиды.",
  },
  {
    title: "Отвечайте на подходящие запросы",
    description: "Выбираете те, где можете быть по-настоящему полезны.",
  },
] as const;

const BENEFITS = [
  {
    icon: MessageSquareText,
    title: "Запрос с контекстом",
    description:
      "Путешественник описывает даты, группу, интересы и бюджет ещё до того, как вы ответите.",
  },
  {
    icon: Handshake,
    title: "Условия на берегу",
    description:
      "Маршрут, формат, цену и дату вы фиксируете в чате — до начала поездки, а не после.",
  },
  {
    icon: ShieldCheck,
    title: "Репутация без шума",
    description:
      "Сильный профиль не теряется рядом со случайными исполнителями.",
  },
] as const;

export default function BecomeAGuidePage() {
  return (
    <InfoPageShell>
      <InfoHero
        eyebrow="Для профессиональных гидов"
        title="Показывайте город тем, кто уже ищет проводника"
        subtitle="Проводник соединяет путешественников с гидами, которые знают своё дело. Вы получаете не холодные заявки, а понятный запрос: город, дата, группа, интересы и бюджет."
        actions={
          <div className="flex flex-col items-start gap-3">
            <Button asChild size="lg">
              <Link href="/auth?role=guide">Подать заявку</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Ответим по анкете в течение 1–2 рабочих дней.
            </p>
          </div>
        }
      />

      <InfoSection title="Что меняется для гида">
        <div className="grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-card border border-border bg-card p-5 shadow-card"
              >
                <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
                <p className="mb-1 text-sm font-semibold text-foreground">{benefit.title}</p>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </InfoSection>

      <InfoSection title="Как попасть в Проводник">
        <div className="space-y-3">
          {STEPS.map((step, index) => (
            <StepCard key={step.title} step={index + 1}>
              <span className="font-semibold text-foreground">{step.title}.</span>{" "}
              {step.description}
            </StepCard>
          ))}
        </div>
      </InfoSection>

      <InfoSection>
        <div className="rounded-card border border-border bg-card p-6 shadow-card">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Мы строим сервис для гидов, которые работают всерьёз.
          </h2>
          <p className="text-sm text-muted-foreground">
            Если вы цените точные договорённости, уважаете время путешественника и умеете делать
            город живым — нам по пути.
          </p>
        </div>
      </InfoSection>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/auth?role=guide">Подать заявку</Link>
        </Button>
      </div>
    </InfoPageShell>
  );
}
