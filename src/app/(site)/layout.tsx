import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeaderServer } from "@/components/shared/site-header-server";

// Every (site) route renders per-request data (auth-aware header, live Supabase
// content). Previously the shared loading.tsx boundary kept the group dynamic;
// with it removed (so detail routes can return a real 404), declare the group
// dynamic explicitly so pages are not static-prerendered at build time — which
// would invoke Supabase without env and break `next build` in CI.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[130] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-medium focus:text-on-surface focus:shadow-lift"
      >
        Перейти к содержимому
      </a>
      <SiteHeaderServer />
      <main id="main-content" className="pt-nav-h">{children}</main>
      <SiteFooter />
    </div>
  );
}
