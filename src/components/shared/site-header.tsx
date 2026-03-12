import Link from "next/link";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/traveler", label: "Traveler" },
  { href: "/guide", label: "Guide" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            P
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Provodnik
            </p>
            <p className="text-sm text-foreground">
              Request-first tours marketplace
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navigation.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
