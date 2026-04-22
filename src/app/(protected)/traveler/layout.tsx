import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { TravelerMobileTabs } from "@/app/(protected)/traveler/traveler-mobile-tabs";

export default async function TravelerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/traveler/dashboard");
  }

  if (auth.role && auth.role !== "traveler") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  return (
    <div className="pb-24 md:pb-0">
      <main className="w-full">{children}</main>
      <TravelerMobileTabs />
    </div>
  );
}
