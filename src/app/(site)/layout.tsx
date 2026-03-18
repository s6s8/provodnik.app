import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_top_right,_rgba(147,51,234,0.18),transparent_52%)]" />
      <div className="relative">
        <SiteHeader />
        <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-16 px-4 py-6 sm:px-6 md:gap-20 md:py-10 lg:px-8 lg:gap-24">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
