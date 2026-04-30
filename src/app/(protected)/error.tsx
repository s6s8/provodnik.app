"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ProtectedErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
  unstable_rethrow(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] flex min-h-[60vh] items-center py-16">
      <section className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass w-full max-w-2xl space-y-6 px-6 py-8 md:px-10 md:py-12">
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">Сбой кабинета</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Раздел временно недоступен
          </h1>
          <p className="max-w-xl text-sm text-ink-3 md:text-base">
            Мы не смогли открыть этот раздел. Попробуйте повторить действие или
            вернуться на главную.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <Button type="button" onClick={() => reset()}>
            Повторить
          </Button>
          <Button asChild variant="outline">
            <Link href="/">На главную</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:support@provodnik.app">Связаться с поддержкой</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
