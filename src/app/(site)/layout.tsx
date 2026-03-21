import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
