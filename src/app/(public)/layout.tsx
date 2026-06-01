import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeaderServer } from "@/components/shared/site-header-server";

export default async function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeaderServer />
      <main className="pt-nav-h">{children}</main>
      <SiteFooter />
    </div>
  );
}
