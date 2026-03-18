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
    <div className="min-h-screen bg-[#050711] text-foreground">
      <SiteHeader />
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.18),_transparent_55%),#050711] shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
          <WorkspaceRoleNav
            auth={auth}
            className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70"
          />
          <main className="px-4 pb-8 pt-6 md:px-6 md:pt-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
