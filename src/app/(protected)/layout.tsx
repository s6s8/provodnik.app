import type { ReactNode } from "react";

import { SiteHeader } from "@/components/shared/site-header";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
