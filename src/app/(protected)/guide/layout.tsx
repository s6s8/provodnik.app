import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { GuideKpiStrip } from "@/components/layout/guide-kpi-strip";
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
      <GuideKpiStrip guideId={auth.userId ?? ""} />
      {children}
    </>
  );
}
