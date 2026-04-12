import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const auth = await readAuthContextFromServer();

  return (
    <>
      <SiteHeader
        isAuthenticated={auth.isAuthenticated}
        role={auth.role}
        email={auth.email}
        canonicalRedirectTo={auth.canonicalRedirectTo}
        userId={auth.userId}
      />
      <main className="pt-nav-h">{children}</main>
    </>
  );
}
