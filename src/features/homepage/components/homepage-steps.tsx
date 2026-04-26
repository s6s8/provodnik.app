import { CheckCircle2, MessageSquare, Pencil } from "lucide-react";

const steps = [
  { Icon: Pencil, label: "Опишите запрос" },
  { Icon: MessageSquare, label: "Получите предложения от гидов" },
  { Icon: CheckCircle2, label: "Выберите лучшее" },
] as const;

export function HomePageSteps() {
  return (
    <section aria-label="Как это работает" className="pt-12 pb-4">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <ol className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            {steps.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 md:flex-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-center text-xs text-muted-foreground md:text-left">
            В Сборной группе можно объединиться с попутчиками и разделить стоимость гида на всех
          </p>
        </div>
      </div>
    </section>
  );
}
