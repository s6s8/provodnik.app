import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-background">
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-16 px-4 py-6 sm:px-6 md:gap-20 md:py-10 lg:px-8 lg:gap-24">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
