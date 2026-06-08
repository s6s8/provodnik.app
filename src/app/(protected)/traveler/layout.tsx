import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function TravelerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/traveler/requests");
  }

  if (!auth.role) {
    redirect(auth.missingRoleRecoveryTo ?? "/auth?error=missing-role");
  }

  if (auth.role !== "traveler") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  return <div className="w-full">{children}</div>;
}
