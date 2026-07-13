import type { Metadata } from "next";
import Link from "next/link";
import { Check, FileCheck2, MessageCircle, ShieldCheck } from "lucide-react";

import { InfoHero, InfoPageShell, InfoSection } from "@/components/shared/info-shell";
import { StepCard } from "@/components/shared/step-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} size="sm">
                <CardHeader>
                  <Icon className="mb-1 size-5 text-primary" aria-hidden="true" />
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {benefit.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </InfoSection>

      <InfoSection>
        <Card>
          <CardHeader>
            <CardTitle aria-level={2}>Кто может работать в Проводнике</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {TRUST.map((item) => (
                <li key={item} className="flex items-start gap-2 text-base text-ink-2">
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </InfoSection>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/auth?role=guide">Подать заявку</Link>
        </Button>
      </div>
    </InfoPageShell>
  );
}
