import Link from "next/link";

import { Compass, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/listings", label: "Экскурсии" },
  { href: "/trust", label: "Как это работает" },
  { href: "/policies/cancellation", label: "Отмена" },
  { href: "/guide", label: "Гидам" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/45 bg-[rgba(251,248,241,0.76)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(33,89,120,0.24)]">
            <Compass className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Provodnik
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              Экскурсии и туры по России
            </p>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="glass-panel flex w-full max-w-xl items-center gap-3 rounded-full border border-white/65 px-4 py-2">
            <Search className="size-4 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
              <span className="truncate font-medium text-foreground">
                Куда поедем?
              </span>
              <span className="text-muted-foreground">Ростов, Байкал, Казань</span>
            </div>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/listings">Найти маршрут</Link>
            </Button>
          </div>
        </div>

        <nav className="hidden items-center gap-1 xl:flex">
          {navigation.map((item) => (
            <Button key={item.href} variant="ghost" asChild className="rounded-full px-4">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" className="hidden rounded-full md:inline-flex">
            <Link href="/traveler">Оставить заявку</Link>
          </Button>
          <Button asChild className="rounded-full px-4">
            <Link href="/auth">Войти</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full xl:hidden">
            <Link href="/listings" aria-label="Открыть каталог">
              <Menu className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
