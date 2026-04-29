import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TravelerRequestCreateScreen } from "@/features/traveler/components/request-create/traveler-request-create-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export const metadata: Metadata = {
  title: "Новый запрос",
};

export default async function TravelerRequestNewPage() {
  const auth = await readAuthContextFromServer();

  if (auth.role === "guide") {
    redirect("/guide");
  }

  return <TravelerRequestCreateScreen />;
}

