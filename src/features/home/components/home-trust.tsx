import { Percent, ScrollText, ShieldCheck } from "lucide-react";

const cards = [
  {
    Icon: ShieldCheck,
    title: "Проверенные гиды",
    subtitle: "Профили, отзывы и специализации видны до контакта — меньше сюрпризов в поездке.",
  },
  {
    Icon: ScrollText,
    title: "Прозрачные условия",
    subtitle: "Отмена, возврат и состав услуг понятны заранее, без мелкого текста в конце страницы.",
  },
  {
    Icon: Percent,
    title: "Комиссия ниже крупных агрегаторов",
    subtitle: "Сервис держит ставку разумной, чтобы цена для путешественника оставалась честной.",
  },
] as const;

export function HomeTrust() {
  return (
    <section className="bg-[#F9F8F7] px-12 pb-16 pt-0">
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-4">
        {cards.map(({ Icon, title, subtitle }) => (
          <div
            key={title}
            className="flex gap-4 rounded-[20px] border border-white/60 bg-white/75 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl"
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50"
              aria-hidden
            >
              <Icon className="size-5 text-[#0F766E]" />
            </div>
            <div>
              <p className="font-sans text-[15px] font-semibold text-[#0F172A]">{title}</p>
              <p className="mt-1 font-sans text-[13px] leading-snug text-[#475569]">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
