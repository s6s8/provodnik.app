import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HomePageHero() {
  return (
    <section
      aria-label="Главный баннер"
      className="-mt-nav-h relative flex min-h-[55vh] max-h-[720px] items-center justify-center overflow-hidden text-center max-md:min-h-[520px]"
    >
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=85"
        alt="Горный пейзаж России — путешествуйте с локальными проводниками"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 block h-full w-full object-cover object-center"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(25,28,32,0.12)_0%,rgba(25,28,32,0.38)_55%,rgba(25,28,32,0.60)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-[2] mx-auto w-full max-w-[860px] px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h)+48px)] pb-14 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
        <h1 className="mb-5 font-display text-[clamp(2.25rem,5vw,3.625rem)] font-semibold leading-[1.06] text-on-surface">
          Опишите экскурсию мечты — гиды сами предложат варианты
        </h1>

        <p className="mx-auto mb-8 max-w-[46rem] text-base leading-[1.6] text-[var(--on-surface-muted)] md:text-lg">
          Не ищите среди сотен предложений. Скажите, что хотите. Лучшие гиды ответят вам.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 max-md:gap-4">
          <Button asChild className="text-white">
            <Link href="/traveler/requests/new">Создать запрос</Link>
          </Button>
          <Link
            href="/requests"
            className="text-sm font-medium text-white/[0.78] transition-colors hover:text-white"
          >
            Смотреть открытые запросы →
          </Link>
        </div>
      </div>
    </section>
  );
}
