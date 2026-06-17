import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  HandCoins,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundSearch,
  WalletCards,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const VALUE_PROPS = [
  {
    title: "Большая часть дохода остаётся вам",
    description:
      "Вы оставляете себе большую часть выручки. Никаких скрытых сборов и платных подписок.",
    Icon: WalletCards,
  },
  {
    title: "Эластичность аудитории",
    description: "Выбираете комфортное для вас количество людей в группе",
    Icon: SlidersHorizontal,
  },
  {
    title: "Принцип торга",
    description:
      "Выбираете подходящую вам цену за человека в группе или предлагаете в ответ свою",
    Icon: HandCoins,
  },
  {
    title: "Время и комфорт",
    description: "Вы выбираете какой запрос подходит вам по дате и времени экскурсии",
    Icon: CalendarClock,
  },
  {
    title: "Модерация за 24–48 часов",
    description:
      "После заполнения анкеты и загрузки документов мы проверяем профиль в течение 1–2 рабочих дней и открываем доступ к запросам.",
    Icon: ShieldCheck,
  },
  {
    title: "Спрос от реальных путешественников",
    description:
      "Запросы поступают напрямую от путешественников с подтверждёнными контактами — вы видите дату, город и количество людей перед тем, как откликнуться.",
    Icon: UserRoundSearch,
  },
] as const;

export default function BecomeAGuidePage() {
  return (
    <article className="bg-[var(--surface)] font-display">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-[clamp(20px,4vw,48px)] py-16 md:py-24">
        <section className="max-w-3xl">
          <h1 className="mb-5 text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--on-surface)]">
            Станьте гидом на Проводнике
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--on-surface-muted)] md:text-xl">
            Размещайте свои экскурсии, отвечайте на запросы путешественников и работайте в удобном вам ритме.
          </p>
          <Link
            href="/auth?role=guide"
            className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[var(--primary)] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_44px_-22px_rgba(10,40,28,0.45)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          >
            Зарегистрироваться
          </Link>
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VALUE_PROPS.map(({ Icon, ...prop }) => (
            <div
              key={prop.title}
              className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 shadow-[var(--card-shadow)]"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--primary)]">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <p className="mb-2 text-lg font-semibold leading-6 text-[var(--on-surface)]">
                {prop.title}
              </p>
              <p className="text-sm leading-6 text-[var(--on-surface-muted)]">
                {prop.description}
              </p>
            </div>
          ))}
        </section>

        <section className="flex justify-center rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 shadow-[var(--card-shadow)] md:p-8">
          <Link
            href="/auth?role=guide"
            className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[var(--primary)] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_44px_-22px_rgba(10,40,28,0.45)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-lowest)]"
          >
            Зарегистрироваться
          </Link>
        </section>
      </div>
    </article>
  );
}
