import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

import { SiteHeaderServer } from "@/components/shared/site-header-server";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (auth.isAuthenticated && auth.accountStatus && auth.accountStatus !== "active") {
    redirect("/auth?error=account-suspended");
  }

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
