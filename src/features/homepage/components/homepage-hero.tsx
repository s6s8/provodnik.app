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
        alt=""
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
        <p className="mb-5 inline-flex items-center rounded-full border border-white/[0.22] bg-white/[0.14] px-4 py-[5px] text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-white/[0.82] backdrop-blur-[12px]">
          Маршруты с локальными проводниками
        </p>

        <h1 className="mb-8 font-display text-[clamp(2.25rem,5vw,3.625rem)] font-semibold leading-[1.06] text-[var(--on-surface)]">
          Путешествуйте по России
          <br />
          с теми, кто знает каждый камень
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6 max-md:gap-4">
          <Button asChild className="text-white">
            <Link href="/requests/new">Создать запрос</Link>
          </Button>
          <Link
            href="/requests"
            className="text-sm font-medium text-white/[0.78] transition-colors hover:text-white"
          >
            Найти группу →
          </Link>
        </div>
      </div>
    </section>
  );
}
