const steps = [
  {
    num: "1",
    title: "Опишите маршрут",
    desc: "Укажите направление, даты и бюджет — займёт пару минут",
  },
  {
    num: "2",
    title: "Получите офферы от гидов",
    desc: "Выберите подходящего проводника из откликов",
  },
  {
    num: "3",
    title: "Путешествуйте",
    desc: "Оплата и выезд — всё согласовано, группа собрана",
  },
] as const;

export function HomePageProcess() {
  return (
    <section id="hiw" className="section low" aria-labelledby="hiw-title">
      <div className="container">
        {/* Section header */}
        <header style={{ textAlign: "center", marginBottom: "52px" }}>
          <p className="sec-label" style={{ marginBottom: "8px" }}>
            Как это работает
          </p>
          <h2 id="hiw-title" className="sec-title">
            Три шага от идеи до поездки
          </h2>
        </header>

        {/* Steps row */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {steps.map((step, index) => (
            <div key={step.num} style={{ display: "contents" }}>
              <article
                style={{
                  flex: 1,
                  textAlign: "center",
                  paddingInline: "20px",
                }}
              >
                {/* Large ghostly step number */}
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(5rem, 10vw, 8rem)",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: "var(--primary)",
                    opacity: 0.18,
                    marginBottom: "14px",
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    color: "var(--on-surface)",
                    marginBottom: "8px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--on-surface-muted)",
                    lineHeight: 1.65,
                    maxWidth: "20ch",
                    marginInline: "auto",
                  }}
                >
                  {step.desc}
                </p>
              </article>

              {/* Dashed connector line between steps */}
              {index < steps.length - 1 ? (
                <div
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: "80px",
                    borderTop: "2px dashed color-mix(in srgb, var(--outline-variant) 60%, transparent)",
                    marginTop: "29px",
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
