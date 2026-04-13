const trustItems = [
  {
    label: "Проверенные гиды",
    description: "Верификация и отзывы от реальных путешественников",
  },
  {
    label: "0% комиссия для гидов",
    description: "Деньги напрямую между путешественником и гидом — без посредников",
  },
  {
    label: "Поддержка 24/7",
    description: "Команда на связи до, во время и после поездки",
  },
] as const;

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function HomePageTrust() {
  return (
    <section
      aria-label="Преимущества Provodnik"
      className="border-t border-b border-outline-variant/40 bg-surface py-14"
    >
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="grid grid-cols-3 gap-9 max-md:grid-cols-1">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3.5">
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary"
              >
                <CheckIcon />
              </div>

              <div>
                <p className="mb-1 text-base font-semibold text-on-surface">{item.label}</p>
                <p className="text-sm leading-[1.55] text-on-surface-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
