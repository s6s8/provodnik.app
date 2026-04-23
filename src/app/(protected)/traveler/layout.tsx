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

  if (auth.role && auth.role !== "traveler") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  return (
    <div>
      <main className="w-full">{children}</main>
    </div>
  );
}
