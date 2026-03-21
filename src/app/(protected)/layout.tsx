import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";
import { WorkspaceRoleNav } from "@/components/shared/workspace-role-nav";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <WorkspaceRoleNav auth={auth} />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
