"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type TravelerBookingErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TravelerBookingError({ error, reset }: TravelerBookingErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] items-center py-10">
      <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass w-full max-w-2xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Сбой бронирования
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Не удалось загрузить бронирование
          </h1>
          <p className="max-w-xl text-sm text-ink-3 md:text-base">
            Попробуйте повторить действие или вернуться к запросам путешественника.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => reset()}>
            Повторить
          </Button>
          <Button asChild variant="outline">
            <Link href="/traveler/requests">К запросам</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
