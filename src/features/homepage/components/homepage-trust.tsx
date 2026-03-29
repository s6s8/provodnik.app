const trustItems = [
  {
    label: "Проверенные гиды",
    description: "Верификация и отзывы от реальных путешественников",
  },
  {
    label: "Безопасные платежи",
    description: "Средства защищены до подтверждения поездки",
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
      style={{
        paddingBlock: "56px",
        background: "var(--surface)",
        borderTop: "1px solid rgba(194,198,214,0.40)",
        borderBottom: "1px solid rgba(194,198,214,0.40)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "36px",
          }}
        >
          {trustItems.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}
            >
              {/* Icon circle */}
              <div
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <CheckIcon />
              </div>

              <div>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--on-surface)",
                    marginBottom: "4px",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--on-surface-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
