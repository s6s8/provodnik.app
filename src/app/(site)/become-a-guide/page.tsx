import type { Metadata } from "next";
import Link from "next/link";
import { Check, FileCheck2, MessageCircle, ShieldCheck } from "lucide-react";

import { InfoHero, InfoPageShell, InfoSection } from "@/components/shared/info-shell";
import { StepCard } from "@/components/shared/step-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const STEPS = [
  "Заполните анкету, добавьте документы и подтверждение квалификации.",
  "Мы проверяем профиль и документы вручную. После одобрения открываем доступ к запросам.",
  "Отвечайте на подходящие запросы и предлагайте формат, дату и цену.",
] as const;

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Только после проверки",
    description:
      "Проверяем анкету, документы и квалификацию до доступа к запросам путешественников.",
  },
  {
    icon: FileCheck2,
    title: "Понятный статус заявки",
    description:
      "После отправки анкета попадает на ручную проверку — обычно это занимает 1–2 рабочих дня.",
  },
  {
    icon: MessageCircle,
    title: "Запросы с понятными условиями",
    description:
      "После одобрения вы отвечаете на подходящие запросы и фиксируете условия письменно.",
  },
] as const;

const TRUST = [
  "Только гиды с аккредитацией или подтверждающими документами.",
  "Профиль и документы проверяются вручную перед доступом к запросам.",
  "Условия фиксируются письменно — без устных договорённостей.",
] as const;

export default function BecomeAGuidePage() {
  return (
    <InfoPageShell>
      <InfoHero
        eyebrow="Для гидов"
        title="Станьте гидом Проводника"
        subtitle="Проводник работает только с аккредитированными гидами. После проверки профиля вы сможете отвечать на подходящие запросы путешественников и предлагать свои условия."
        actions={
          <Button asChild size="lg">
            <Link href="/auth?role=guide">Подать заявку</Link>
          </Button>
        }
      />

      <InfoSection title="Как стать гидом">
        <div className="space-y-3">
          {STEPS.map((step, index) => (
            <StepCard key={step} step={index + 1}>
              {step}
            </StepCard>
          ))}
        </div>
      </InfoSection>

      <InfoSection>
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

        <section className="mb-12 rounded-card border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Кто может работать в Проводнике
          </h2>
          <ul className="space-y-3">
            {TRUST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/auth?role=guide">Подать заявку</Link>
          </Button>
        </div>
    </InfoPageShell>
  );
}
