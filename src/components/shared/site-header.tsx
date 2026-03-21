import Link from "next/link";

import { Compass, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/destinations", label: "Направления" },
  { href: "/requests", label: "Запросы" },
  { href: "/listings", label: "Экскурсии" },
  { href: "/guide", label: "Гидам" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Compass className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Provodnik
            </p>
            <p className="truncate text-sm font-medium text-white/90">
              Путешествия с локальными гидами
            </p>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center xl:flex">
          <Link
            href="/listings"
            className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-md transition-all duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Search className="size-4 text-white/60" />
            <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
              <span className="truncate font-medium text-white/85">
                Куда поедем?
              </span>
              <span className="truncate text-white/50">Ростов, Байкал, Казань</span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className="rounded-full px-4 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button asChild className="hidden rounded-full px-4 md:inline-flex">
            <Link href="/traveler/requests/new">Создать запрос</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="hidden rounded-full px-4 text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link href="/auth">Войти</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full text-white lg:hidden">
            <Link href="/listings" aria-label="Открыть меню">
              <Menu className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
