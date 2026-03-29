import Link from "next/link";

interface PageSectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}

export function PageSectionHeader({
  label,
  title,
  description,
  linkText,
  linkHref,
}: PageSectionHeaderProps) {
  return (
    <div
      style={{
        background: "var(--surface-low)",
        padding: "100px 0 48px",
        textAlign: "center",
      }}
    >
      <p
        className="sec-label"
        style={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--on-surface-muted)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.875rem, 3.5vw, 2.375rem)",
          fontWeight: 600,
          lineHeight: 1.1,
          color: "var(--on-surface)",
        }}
      >
        {title}
      </h1>

      {description ? (
        <p
          className="lead"
          style={{
            maxWidth: "760px",
            margin: "16px auto 0",
            fontSize: "1rem",
            color: "var(--on-surface-muted)",
            lineHeight: 1.65,
          }}
        >
          {description}
        </p>
      ) : null}

      {linkText && linkHref ? (
        <div style={{ marginTop: "24px" }}>
          <Link
            href={linkHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 18px",
              borderRadius: "9999px",
              border: "1px solid rgba(0, 88, 190, 0.22)",
              color: "var(--primary)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {linkText}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
