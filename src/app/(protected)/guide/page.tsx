import type { Metadata } from "next";

import { BirjhaScreen } from "@/features/guide/components/birjha/birjha-screen";

export const metadata: Metadata = {
  title: "Биржа",
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = params.tab === "bookings" ? "bookings" : "inbox";
  return <BirjhaScreen initialTab={tab} />;
}
