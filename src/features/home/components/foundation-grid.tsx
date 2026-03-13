const steps = [
  {
    number: "01",
    title: "Выбираете маршрут или город",
    description:
      "Сначала смотрите готовые экскурсии по цене, длительности и формату группы.",
  },
  {
    number: "02",
    title: "Отправляете заявку",
    description:
      "Если нужен маршрут под даты или особый формат, отправляете запрос с бюджетом и составом группы.",
  },
  {
    number: "03",
    title: "Гид подтверждает детали",
    description:
      "В карточке видно, кто ведет маршрут, какие есть отзывы и как быстро обычно отвечают.",
  },
  {
    number: "04",
    title: "Бронируете без сюрпризов",
    description:
      "До оплаты понятны условия отмены, возвратов и что точно входит в программу.",
  },
] as const;

export function FoundationGrid() {
  return (
    <section className="section-frame rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-4">
          <p className="editorial-kicker">Как это работает</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Бронирование строится вокруг ясного решения, а не переписки наугад.
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
            Логика сервиса простая: сначала выбор маршрута, потом подтверждение
            деталей и только после этого финальное бронирование. Так турист видит,
            за что он платит и кто именно ведет программу.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-[1.8rem] border border-border/75 bg-white/72 p-5 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {step.number}
              </p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
