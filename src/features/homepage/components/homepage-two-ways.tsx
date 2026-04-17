import Link from "next/link";

import { Button } from "@/components/ui/button";

const ways = [
  {
    title: "Готовый тур",
    body: "Выберите готовый тур у гида и забронируйте напрямую",
    cta: "Смотреть туры",
    href: "/listings",
  },
  {
    title: "Свой запрос",
    body: "Опишите, что хотите — гиды предложат вам варианты с ценой",
    cta: "Создать запрос",
    href: "/traveler/requests/new",
  },
] as const;

export function HomePageTwoWays() {
  return (
    <section
      aria-labelledby="two-ways-title"
      className="bg-surface py-sec-pad"
    >
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-10 text-center">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Два способа поехать
          </p>
          <h2
            id="two-ways-title"
            className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]"
          >
            Как вы хотите путешествовать?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {ways.map((way) => (
            <article
              key={way.href}
              className="flex flex-col rounded-card bg-surface-high p-8 shadow-card"
            >
              <h3 className="mb-3 font-sans text-xl font-semibold text-foreground">
                {way.title}
              </h3>
              <p className="mb-6 flex-1 font-sans text-sm leading-[1.65] text-muted-foreground">
                {way.body}
              </p>
              <Button asChild className="self-start">
                <Link href={way.href}>{way.cta}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
