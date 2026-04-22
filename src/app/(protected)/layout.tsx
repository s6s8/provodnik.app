import { Suspense, type ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  return (
    <div className="min-h-screen pt-[88px]">
      <SiteHeader
        isAuthenticated={auth.isAuthenticated}
        role={auth.role}
        email={auth.email}
        canonicalRedirectTo={auth.canonicalRedirectTo}
        userId={auth.userId}
      />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
