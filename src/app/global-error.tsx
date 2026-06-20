"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // global-error replaces the root layout, so no app CSS variables / shared
  // components are available here — use plain inline-styled markup only.
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f6f7f9",
          color: "#111827",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "32rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
            Что-то пошло не так
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: 0,
              color: "#4b5563",
            }}
          >
            Приложение столкнулось с критической ошибкой. Попробуйте обновить
            страницу.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: "44px",
              padding: "0 24px",
              borderRadius: "12px",
              border: "none",
              background: "#111827",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </main>
      </body>
    </html>
  );
}
