import { MapPin, MessageSquare, Flag } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MapPin,
    title: "Создайте запрос",
    desc: "Укажите направление, даты, бюджет и размер группы",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Получите предложения от гидов",
    desc: "Проверенные гиды видят ваш запрос и присылают персональные предложения",
  },
  {
    num: "03",
    icon: Flag,
    title: "Выберите лучшее",
    desc: "Сравните предложения, выберите гида и договоритесь о встрече",
  },
] as const;

export function HomePageProcess() {
  return (
    <section id="hiw" className="bg-surface-low py-sec-pad" aria-labelledby="hiw-title">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-13 text-center">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Как это работает
          </p>
          <h2
            id="hiw-title"
            className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]"
          >
            Три шага от идеи до поездки
          </h2>
        </div>

        <div className="flex items-stretch max-md:flex-col max-md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex min-w-0 flex-1 items-center max-md:block">
                <article className="flex h-full flex-1 flex-col rounded-card bg-surface-high p-7 shadow-card">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-sans text-[0.6875rem] font-semibold tabular-nums leading-none text-muted-foreground/60"
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mb-2 font-sans text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm leading-[1.65] text-muted-foreground">
                    {step.desc}
                  </p>
                </article>
                {index < steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="mx-3 w-12 shrink-0 border-t-2 border-dashed border-outline-variant/60 max-md:hidden"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
