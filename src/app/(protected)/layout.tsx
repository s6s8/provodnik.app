import { Suspense, type ReactNode } from "react";

import { SiteHeaderServer } from "@/components/shared/site-header-server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen pt-[88px]">
      <SiteHeaderServer />
      <main className="w-full px-[clamp(20px,4vw,48px)] py-8 md:py-10">
        <div className="mx-auto w-full max-w-page">
          <Suspense>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
