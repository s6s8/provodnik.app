import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { GuideBottomNav } from "@/components/shared/guide-bottom-nav";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function GuideLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/guide/inbox");
  }

  if (auth.role && auth.role !== "guide") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  return (
    <>
      <div className="pb-[calc(64px+env(safe-area-inset-bottom)+12px)] md:pb-0">
        {children}
      </div>
      <GuideBottomNav />
    </>
  );
}
