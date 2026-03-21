import Image from "next/image";
import Link from "next/link";

/** Bright alpine lake / shoreline — readable, airy hero (spec: full-width ~520px, object-cover). */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1454496522488-7a859e724422?auto=format&fit=crop&w=1600&h=900&q=80";

export function HomeHero() {
  return (
    <section className="relative isolate min-h-[520px] w-full overflow-hidden pt-[72px]">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-slate-900/10"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-[520px] flex-col justify-end pb-[120px] pt-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-12 text-center">
          <p className="mb-4 font-sans text-[13px] tracking-[0.05em] text-[#475569]">
            Маршруты с локальными проводниками
          </p>
          <h1 className="mb-6 max-w-4xl font-serif text-[52px] font-semibold leading-[1.15] tracking-tight text-[#0F172A]">
            Объединяйтесь. Договаривайтесь.
            <br />
            Путешествуйте по России лучше.
          </h1>

          <div className="mb-5 flex w-full max-w-[480px] items-center justify-between gap-3 rounded-full border border-[#CBD5E1] bg-white/75 py-3.5 pl-6 pr-4 backdrop-blur-md">
            <input
              type="search"
              name="hero-destination"
              placeholder="Куда едем?"
              className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0F766E] px-5 py-2.5 font-sans text-sm font-semibold text-white"
            >
              <span aria-hidden>🔍</span>
              Найти
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/requests/new"
              className="inline-flex rounded-full bg-[#0F766E] px-7 py-3 font-sans text-sm font-semibold text-white shadow-[0_4px_16px_rgba(15,118,110,0.3)]"
            >
              Создать запрос
            </Link>
            <Link
              href="/requests"
              className="inline-flex rounded-full border border-[#CBD5E1] bg-white/70 px-7 py-3 font-sans text-sm font-medium text-[#0F172A] backdrop-blur-md"
            >
              Найти группу
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
