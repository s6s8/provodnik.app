import Link from "next/link";

export default function SiteNotFound() {
  return (
    <main className="container flex min-h-[70vh] items-center py-16">
      <section className="glass-card w-full max-w-2xl space-y-6 px-6 py-8 md:px-10 md:py-12">
        <div className="space-y-3">
          <p className="editorial-kicker">404</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Эта страница не найдена
          </h1>
          <p className="max-w-xl text-sm text-[var(--ink-3)] md:text-base">
            Ссылка могла устареть или вести не туда. Выберите другой раздел,
            чтобы продолжить.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/requests" className="btn-primary">
            К запросам
          </Link>
          <Link href="/guides" className="btn-ghost">
            К проводникам
          </Link>
        </div>
      </section>
    </main>
  );
}
