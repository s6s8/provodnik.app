import Link from "next/link";

const footerColumns = [
  {
    title: "Путешественникам",
    links: [
      { href: "/listings", label: "Каталог экскурсий" },
      { href: "/traveler", label: "Личный кабинет" },
      { href: "/trust", label: "Гарантии и поддержка" },
    ],
  },
  {
    title: "Сервис",
    links: [
      { href: "/guide", label: "Стать гидом" },
      { href: "/policies/cancellation", label: "Правила отмены" },
      { href: "/policies/refunds", label: "Возвраты" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            Provodnik
          </p>
          <h2 className="max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Удобное бронирование экскурсий без хаоса в переписке и скрытых условий.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-white/70">
            Подбирайте маршруты по городу, длительности и формату, а если готового
            тура нет, отправляйте заявку и получайте ответ от живого гида.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <p className="text-sm font-semibold text-white">{column.title}</p>
              <div className="grid gap-3 text-sm text-white/70">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
