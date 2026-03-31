"use client";

import Link from "next/link";
import { useEffect } from "react";

type SiteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ error, reset }: SiteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container flex min-h-[70vh] items-center py-16">
      <section className="glass-card w-full max-w-2xl space-y-6 px-6 py-8 md:px-10 md:py-12">
        <div className="space-y-3">
          <p className="editorial-kicker">Сбой страницы</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Страница временно недоступна
          </h1>
          <p className="max-w-xl text-sm text-[var(--ink-3)] md:text-base">
            Мы не смогли показать эту страницу. Попробуйте повторить действие
            или вернуться на главную.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Повторить
          </button>
          <Link href="/" className="btn-ghost">
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
