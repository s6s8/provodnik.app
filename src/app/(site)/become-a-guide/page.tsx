import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const VALUE_PROPS = [
  {
    title: "Нулевая комиссия",
    description: "Вы устанавливаете цену и забираете её полностью. Мы не берём процент.",
  },
  {
    title: "Свободный график",
    description: "Принимайте только те запросы, которые вам интересны, в удобное время.",
  },
  {
    title: "Входящие запросы",
    description: "Путешественники оставляют запросы — гиды откликаются. Вам не нужно искать клиентов.",
  },
] as const;

export default function BecomeAGuidePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      <h1 className="mb-4 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.2] text-foreground">
        Станьте гидом на Проводнике
      </h1>
      <p className="mb-10 text-base text-muted-foreground">
        Принимайте запросы от путешественников и проводите экскурсии на своих условиях.
      </p>

      <div className="mb-10 space-y-4">
        {VALUE_PROPS.map((prop) => (
          <div
            key={prop.title}
            className="rounded-xl border border-border/70 bg-card/90 p-5"
          >
            <p className="mb-1 text-sm font-semibold text-foreground">{prop.title}</p>
            <p className="text-sm text-muted-foreground">{prop.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start gap-3">
        <Link
          href="/auth?role=guide"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Зарегистрироваться — займёт 2 минуты
        </Link>
        <Link
          href="/auth"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Уже есть аккаунт? Войти
        </Link>
      </div>
    </main>
  );
}
