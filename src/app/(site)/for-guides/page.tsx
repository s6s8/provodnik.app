import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Users, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Стать гидом на Проводнике — 0% комиссия",
  description:
    "Принимайте запросы от путешественников напрямую. Ноль комиссии — вы получаете полную стоимость каждого тура.",
};

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export default function ForGuidesPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="pt-24 pb-16 text-center px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-semibold text-green-700 mb-6">
            {COPY.zeroCommissionShort}
          </div>
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight text-foreground mb-4">
            Принимайте запросы от путешественников.
            <br />
            Зарабатывайте больше.
          </h1>
          <p className="text-lg text-ink-2 mb-8">
            На Проводнике 0% комиссии. Всё, что вы зарабатываете — ваше.
            Путешественники сами публикуют что хотят — вы предлагаете условия.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6">
            <Link href="/auth?role=guide">Зарегистрироваться как гид</Link>
          </Button>
        </div>
      </section>

      {/* Commission comparison */}
      <section className="py-14 border-t border-b border-outline-variant/40 bg-surface-high">
        <div className="mx-auto max-w-3xl px-[clamp(20px,4vw,48px)]">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            Сравните комиссии платформ
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-6 font-medium text-muted-foreground">
                    Платформа
                  </th>
                  <th className="text-center py-3 px-6 font-medium text-muted-foreground">
                    Комиссия
                  </th>
                  <th className="text-right py-3 pl-6 font-medium text-muted-foreground">
                    Что остаётся гиду с 5 000 ₽
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60 bg-green-50/50">
                  <td className="py-4 pr-6 font-semibold text-foreground">Проводник</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-green-600 text-base">
                      0%
                    </span>
                  </td>
                  <td className="py-4 pl-6 text-right font-semibold text-foreground">
                    5 000 ₽
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-4 pr-6 text-muted-foreground">Tripster</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">22%</td>
                  <td className="py-4 pl-6 text-right text-muted-foreground">3 900 ₽</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-4 pr-6 text-muted-foreground">Airbnb Experiences</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">20%</td>
                  <td className="py-4 pl-6 text-right text-muted-foreground">4 000 ₽</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-muted-foreground">Экскурсионный брокер</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">
                    25–30%
                  </td>
                  <td className="py-4 pl-6 text-right text-muted-foreground">
                    3 500–3 750 ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            * Деньги передаются напрямую между путешественником и гидом. Проводник не
            обрабатывает платежи.
          </p>
        </div>
      </section>

      {/* How it works for guides */}
      <section className="py-16 px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-10">
            Как это работает для гидов
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Users,
                title: "Создайте профиль",
                desc: "Расскажите о себе, своём опыте и городе. Загрузите фото и описание ваших экскурсий.",
              },
              {
                num: "02",
                icon: MessageSquare,
                title: "Получайте запросы",
                desc: "Путешественники публикуют что хотят — вы видите их запросы и отправляете предложение с вашей ценой.",
              },
              {
                num: "03",
                icon: CheckCircle2,
                title: "Предлагайте условия",
                desc: "Вы сами устанавливаете цену и детали. Путешественник сравнивает предложения и выбирает лучшее.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground/60 font-mono">
                      {step.num}
                    </span>
                    <Icon className="size-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-ink-2">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits list */}
      <section className="py-14 border-t border-outline-variant/40 bg-surface-high px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            Почему Проводник
          </h2>
          <ul className="space-y-4">
            {[
              "0% комиссии — все деньги ваши",
              "Запросы от путешественников приходят к вам сами",
              "Вы устанавливаете свою цену и условия",
              "Конкурируете качеством, не рекламным бюджетом",
              "Деньги напрямую — без посредников",
              "Группы формируются сами — один тур, больше участников",
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2
                  className="size-5 text-green-600 mt-0.5 shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 text-center px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Начните прямо сейчас
          </h2>
          <p className="text-ink-2 mb-6">
            Регистрация бесплатна. Никаких взносов. Никаких подписок.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6">
            <Link href="/auth?role=guide">Зарегистрироваться как гид</Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/auth" className="underline hover:text-foreground">
              Войти
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
