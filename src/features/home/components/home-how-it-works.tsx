import {
  Banknote,
  CheckCircle,
  ChevronRight,
  Handshake,
  Search,
  Users,
} from "lucide-react";

const steps = [
  { n: 1, label: "Создать запрос", Icon: Search },
  { n: 2, label: "Группа формируется", Icon: Users },
  { n: 3, label: "Гиды предлагают цену", Icon: Banknote },
  { n: 4, label: "Договариваетесь", Icon: Handshake },
  { n: 5, label: "Экскурсия подтверждена", Icon: CheckCircle },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="bg-[#F9F8F7] px-12 py-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-10 font-sans text-[28px] font-semibold text-[#0F172A]">Как это работает</h2>
        <div className="flex w-full flex-wrap items-stretch gap-y-4 lg:flex-nowrap">
          {steps.map(({ n, label, Icon }, idx) => (
            <div key={n} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-h-[120px] min-w-0 flex-1 flex-col justify-center rounded-2xl border border-[#E2E8F0] bg-white/80 px-4 py-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-3xl font-bold leading-none text-[#0F172A]">{n}.</span>
                  <Icon className="size-5 shrink-0 text-[#0F766E]" aria-hidden strokeWidth={2} />
                </div>
                <p className="mt-2 font-sans text-sm font-semibold leading-snug text-[#0F172A]">{label}</p>
              </div>
              {idx < steps.length - 1 ? (
                <div className="flex shrink-0 items-center justify-center px-1 lg:px-2">
                  <ChevronRight
                    className="size-5 text-[#CBD5E1]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
