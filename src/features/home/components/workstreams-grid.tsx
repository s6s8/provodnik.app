import Link from "next/link";

import { LifeBuoy, ShieldCheck, Star, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const trustCards = [
  {
    title: "Проверенные гиды",
    description:
      "Профиль, отзывы, языки, специализация и сигналы доверия видны до заявки.",
    icon: ShieldCheck,
  },
  {
    title: "Честные отзывы",
    description:
      "Отзывы публикуются после реальной поездки и помогают понять темп и качество маршрута.",
    icon: Star,
  },
  {
    title: "Поддержка в спорных случаях",
    description:
      "Если маршрут меняется или возникают вопросы, у сервиса есть понятная операторская поддержка.",
    icon: LifeBuoy,
  },
  {
    title: "Ясные условия",
    description:
      "До бронирования видны правила отмены, возвратов и что входит в стоимость.",
    icon: Wallet,
  },
] as const;

export function WorkstreamsGrid() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
      <div className="grid gap-4 sm:grid-cols-2">
        {trustCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="section-frame rounded-[1.8rem] p-5 sm:p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="section-frame rounded-[2.2rem] p-6 sm:p-8">
        <p className="editorial-kicker">Для гидов тоже</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Гид получает не поток случайных лидов, а понятную рабочую область.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
          У сервиса есть отдельные кабинеты для путешественника, гида и оператора:
          заявки, переписка, отзывы, модерация и статусы не размазаны по разным
          чатам и таблицам.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full px-5">
            <Link href="/guide">Рабочая область гида</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link href="/auth">Войти в сервис</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
