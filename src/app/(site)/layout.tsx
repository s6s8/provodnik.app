import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
      <SiteHeader />
      <main className="pt-[var(--nav-h)]">{children}</main>
      <SiteFooter />
    </div>
  );
}
