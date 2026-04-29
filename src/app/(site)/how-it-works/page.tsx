import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Как это работает",
};

const BIRJA_STEPS = [
  {
    step: "1",
    title: "Опишите поездку",
    description:
      "Укажите город, даты, интересы и бюджет. Форма занимает минуту.",
  },
  {
    step: "2",
    title: "Получите предложения от гидов",
    description:
      "Местные гиды видят ваш запрос и откликаются с программой и ценой.",
  },
  {
    step: "3",
    title: "Выберите подходящее",
    description:
      "Сравните предложения, задайте вопросы прямо в чате и подтвердите поездку.",
  },
] as const;

const CATALOG_STEPS = [
  {
    step: "1",
    title: "Просмотрите каталог",
    description:
      "Готовые экскурсии от местных гидов с фиксированной ценой и расписанием.",
  },
  {
    step: "2",
    title: "Выберите дату",
    description: "Найдите свободное место и выберите удобное время.",
  },
  {
    step: "3",
    title: "Забронируйте",
    description: "Подтвердите бронь — гид получит уведомление и свяжется с вами.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      <h1 className="mb-3 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.2] text-foreground">
        Как это работает
      </h1>
      <p className="mb-12 text-base text-muted-foreground">
        Два способа организовать экскурсию — на ваш выбор.
      </p>

      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Биржа — под ваш запрос
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Опишите поездку — гиды откликнутся с индивидуальной программой и ценой.
        </p>
        <div className="space-y-3">
          {BIRJA_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 rounded-xl border border-border/70 bg-card/90 p-5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </span>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/requests/new"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Создать запрос
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Готовые экскурсии — выбор из каталога
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Фиксированная цена, готовый маршрут — просто найдите удобное время.
        </p>
        <div className="space-y-3">
          {CATALOG_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 rounded-xl border border-border/70 bg-card/90 p-5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </span>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Смотреть экскурсии
          </Link>
        </div>
      </section>
    </main>
  );
}
