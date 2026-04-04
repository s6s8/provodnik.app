import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SiteNotFound() {
  return (
    <main className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] flex min-h-[70vh] items-center py-16">
      <section className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass w-full max-w-2xl space-y-6 px-6 py-8 md:px-10 md:py-12">
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">404</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Эта страница не найдена
          </h1>
          <p className="max-w-xl text-sm text-ink-3 md:text-base">
            Ссылка могла устареть или вести не туда. Выберите другой раздел,
            чтобы продолжить.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/requests">К запросам</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guides">К проводникам</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:support@provodnik.app">Связаться с поддержкой</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
