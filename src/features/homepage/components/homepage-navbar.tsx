import Link from "next/link";
import { Compass } from "lucide-react";

import { homepageContent } from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

export function HomePageNavbar() {
  return (
    <nav
      className="relative z-20 flex w-full items-center justify-between bg-[rgba(255,255,255,0.52)] px-5 py-3.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)] backdrop-blur-[16px] backdrop-saturate-150 md:px-10 lg:px-12"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.45)" }}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 text-[1.05rem] font-semibold tracking-tight text-[var(--color-text)]"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-[rgba(15,118,110,0.12)] text-[var(--color-primary)] ring-1 ring-white/60">
          <Compass className="size-[18px]" strokeWidth={1.75} />
        </span>
        <span>Provodnik</span>
      </Link>

      <div className="hidden items-center gap-7 md:flex lg:gap-8">
        {homepageContent.navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "border-b-2 border-transparent pb-0.5 text-[0.9375rem] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]",
              item.active && "border-[var(--color-primary)] text-[var(--color-primary)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
