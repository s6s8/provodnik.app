import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Search, Star, Users, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Как работает Проводник",
  description: "Путешественники публикуют запросы, гиды предлагают условия. Вы выбираете лучшее.",
};

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-surface pt-8">
      <section className="pt-16 pb-10 text-center px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold text-foreground mb-4">
            Как работает Проводник
          </h1>
          <p className="text-lg text-ink-2">
            Не ищите среди сотен предложений. Скажите, что хотите — лучшие гиды ответят вам.
          </p>
        </div>
      </section>

      <section className="py-14 border-t border-outline-variant/40 px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            Для путешественников
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-10">От желания до поездки — три шага</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Search,
                title: "Опишите что хотите",
                desc: "Укажите город, даты, размер группы и интересы. Не нужно листать 50 предложений — просто скажите, что вам нужно.",
              },
              {
                num: "02",
                icon: MessageSquare,
                title: "Получите предложения от гидов",
                desc: "Проверенные гиды видят ваш запрос и присылают персональные предложения с ценой и деталями.",
              },
              {
                num: "03",
                icon: CheckCircle2,
                title: "Выберите лучшее",
                desc: "Сравните предложения по цене, рейтингу и времени ответа. Примите лучшее — контакты гида откроются сразу.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground/60 font-mono">{step.num}</span>
                    <Icon className="size-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-ink-2 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href="/traveler/requests/new">{COPY.createRequest}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-outline-variant/40 bg-surface-high px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Бонус</div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Путешествуйте дешевле с группой</h2>
          <p className="text-ink-2 mb-6 max-w-xl">
            Другие путешественники могут присоединиться к вашему запросу. Когда группа растёт — цена
            на человека падает. Это не случайность, это система.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm text-muted-foreground mb-1">Запрос на 2 человека</p>
              <p className="text-2xl font-bold text-foreground">4 000 ₽</p>
              <p className="text-xs text-muted-foreground mt-1">за человека</p>
            </div>
            <div className="flex items-center justify-center text-muted-foreground">→</div>
            <div className="flex-1 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm text-muted-foreground mb-1">Присоединились ещё 2</p>
              <p className="text-2xl font-bold text-green-700">2 100 ₽</p>
              <p className="text-xs text-green-600 mt-1">за человека — экономия 47%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-outline-variant/40 px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Для гидов</div>
          <h2 className="text-2xl font-semibold text-foreground mb-10">Запросы приходят к вам сами</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Users,
                title: "Создайте профиль",
                desc: "Расскажите о себе, загрузите фото. Путешественники видят ваш рейтинг и время ответа.",
              },
              {
                num: "02",
                icon: Zap,
                title: "Реагируйте на запросы",
                desc: "Путешественники публикуют что хотят. Отправьте предложение с вашей ценой и деталями.",
              },
              {
                num: "03",
                icon: Star,
                title: "Стройте репутацию",
                desc: "После поездки путешественники оставляют отзыв. Хорошие отзывы — больше заказов.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground/60 font-mono">{step.num}</span>
                    <Icon className="size-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-ink-2 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10">
            <Button asChild variant="outline" size="lg">
              <Link href="/for-guides">{COPY.nav.becomeGuide}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-outline-variant/40 bg-surface-high px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-10">Частые вопросы</h2>
          <div className="space-y-6">
            {[
              {
                q: "Это бесплатно?",
                a: "Да. Для путешественников — полностью бесплатно. Для гидов — 0% комиссии. Деньги идут напрямую.",
              },
              {
                q: "Как гиды получают оплату?",
                a: "Деньги передаются напрямую между путешественником и гидом — наличными или переводом. Мы не обрабатываем платежи.",
              },
              {
                q: "Могу ли я присоединиться к чужой группе?",
                a: "Да. На странице открытых запросов вы видите что ищут другие путешественники. Присоединитесь к подходящей группе — разделите стоимость.",
              },
              {
                q: "Как долго ждать предложения?",
                a: "Большинство запросов получают первое предложение в течение нескольких часов. Среднее время ответа гида — 4 минуты.",
              },
              {
                q: "Что если гид не ответит?",
                a: "Вы можете просмотреть другие предложения или отменить запрос в любой момент. Никаких обязательств до принятия предложения.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border/60 pb-5">
                <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center px-[clamp(20px,4vw,48px)]">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Готовы попробовать?</h2>
        <p className="text-ink-2 mb-6">Опишите свою мечту — гиды сами вас найдут.</p>
        <Button asChild size="lg">
          <Link href="/traveler/requests/new">{COPY.createRequest}</Link>
        </Button>
      </section>
    </div>
  );
}
