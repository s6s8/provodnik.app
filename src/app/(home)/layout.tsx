import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const auth = await readAuthContextFromServer();

  return (
    <>
      <SiteHeader isAuthenticated={auth.isAuthenticated} />
      <main className="pt-[var(--nav-h)]">{children}</main>
    </>
  );
}
