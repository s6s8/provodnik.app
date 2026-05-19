import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Стать гидом",
};

const VALUE_PROPS = [
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
    <article className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      <h1 className="mb-4 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.2] text-foreground">
        Станьте гидом на Проводнике
      </h1>
      <p className="mb-10 text-base text-muted-foreground">
        Размещайте свои экскурсии, отвечайте на запросы путешественников и работайте в удобном вам ритме.
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

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/auth?role=guide"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Зарегистрироваться
        </Link>
      </div>
    </article>
  );
}
