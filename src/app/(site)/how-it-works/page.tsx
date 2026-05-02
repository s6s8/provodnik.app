import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Как это работает",
};

const REQUEST_STEPS = [
  {
    step: "1",
    text: "Укажите город, даты, формат группы (своя или сборная) и желаемый бюджет.",
  },
  {
    step: "2",
    text: "Гиды откликнутся с программой и ценой — сравните и выберите.",
  },
  {
    step: "3",
    text: "Подтвердите бронирование в чате.",
  },
] as const;

const CATALOG_STEPS = [
  {
    step: "1",
    text: "Выберите маршрут из каталога с фиксированной ценой и расписанием.",
  },
  {
    step: "2",
    text: "Найдите свободное место на удобную дату.",
  },
  {
    step: "3",
    text: "Оплатите — подтверждение придёт автоматически.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      <h1 className="mb-12 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.2] text-foreground">
        Как это работает
      </h1>

      <section className="mb-12">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Запрос гидам
        </h2>
        <div className="space-y-3">
          {REQUEST_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 rounded-xl border border-border/70 bg-card/90 p-5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </span>
              <p className="text-sm text-foreground">{item.text}</p>
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
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Готовые экскурсии
        </h2>
        <div className="space-y-3">
          {CATALOG_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 rounded-xl border border-border/70 bg-card/90 p-5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </span>
              <p className="text-sm text-foreground">{item.text}</p>
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
    </article>
  );
}
