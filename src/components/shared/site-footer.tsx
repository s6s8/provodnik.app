import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">Provodnik</p>
          <p>Marketplace baseline for the Russia tours MVP.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/traveler" className="transition-colors hover:text-foreground">
            Traveler
          </Link>
          <Link href="/guide" className="transition-colors hover:text-foreground">
            Guide
          </Link>
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
