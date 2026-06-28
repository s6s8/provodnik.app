import type { Metadata } from "next";
import Link from "next/link";
import { Check, MessageCircle, TrendingUp, Users } from "lucide-react";

import { ArticleShell } from "@/components/shared/article-shell";
import { StepCard } from "@/components/shared/step-card";
import { ListHero } from "@/components/shared/list-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const STEPS = [
  "Заполните анкету и загрузите документы.",
  "Проверка профиля за 24–48 часов — после одобрения открываем доступ к запросам.",
  "Отвечайте на запросы и выбирайте подходящие по дате и цене.",
] as const;

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Большая часть дохода — вам",
    description:
      "Вы оставляете себе большую часть выручки. Никаких скрытых сборов и платных подписок.",
  },
  {
    icon: Users,
    title: "Ваш ритм и ваша группа",
    description:
      "Выбираете комфортное количество людей в группе и берёте только те запросы, что подходят вам по дате и времени.",
  },
  {
    icon: MessageCircle,
    title: "Прозрачный торг по цене",
    description:
      "Выбираете подходящую цену за человека в группе или предлагаете в ответ свою.",
  },
] as const;

const TRUST = [
  "Профиль и документы проверяются вручную командой.",
  "Запросы поступают с подтверждёнными контактами путешественника.",
  "Условия фиксируются письменно — без устных договорённостей.",
] as const;

export default function BecomeAGuidePage() {
  return (
    <article>
      <ListHero
        imageUrl="/hero-valley.jpg"
        title="Станьте гидом Проводника"
        intro="Зарабатывайте на авторских экскурсиях — вы выбираете запросы, цену и ритм."
      >
        <Button asChild size="lg">
          <Link href="/auth?role=guide">Стать гидом</Link>
        </Button>
      </ListHero>

      <ArticleShell>
        <section className="mb-12">
          <h2 className="mb-6 text-section font-extrabold tracking-tight text-foreground">
            Как стать гидом
          </h2>
          <div className="space-y-3">
            {STEPS.map((step, index) => (
              <StepCard key={step} step={index + 1}>
                {step}
              </StepCard>
            ))}
          </div>
        </section>

        <section className="mb-12">
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
        </section>

        <section className="mb-12 rounded-card border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Гиды Проводника — реальные специалисты
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
            <Link href="/auth?role=guide">Стать гидом</Link>
          </Button>
        </div>
      </ArticleShell>
    </article>
  );
}
