import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const auth = await readAuthContextFromServer();

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
      <SiteHeader isAuthenticated={auth.isAuthenticated} />
      <main className="pt-[var(--nav-h)]">{children}</main>
      <SiteFooter />
    </div>
  );
}
