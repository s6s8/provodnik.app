import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { flags } from "@/lib/flags";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const auth = await readAuthContextFromServer();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeader
        isAuthenticated={auth.isAuthenticated}
        role={auth.role}
        email={auth.email}
        canonicalRedirectTo={auth.canonicalRedirectTo}
        userId={auth.userId}
        notificationsEnabled={flags.FEATURE_TR_NOTIFICATIONS}
      />
      <main className="pt-nav-h">{children}</main>
      <SiteFooter />
    </div>
  );
}
