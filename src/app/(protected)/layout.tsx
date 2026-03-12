import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";
import { WorkspaceRoleNav } from "@/components/shared/workspace-role-nav";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />
      <WorkspaceRoleNav />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
