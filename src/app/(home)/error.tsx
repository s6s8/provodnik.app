"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-page flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
      <p className="text-sm text-muted-foreground">Мы уже знаем об ошибке и разбираемся.</p>
      <button type="button" onClick={reset} className="rounded-xl border border-border px-4 py-2 text-sm">
        Попробовать снова
      </button>
    </main>
  );
}
