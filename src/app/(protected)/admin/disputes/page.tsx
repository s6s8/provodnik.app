import type { Metadata } from "next";

import { DisputesQueue } from "@/features/admin/components/disputes/disputes-queue";
import { getDisputes } from "@/lib/supabase/disputes";

export const metadata: Metadata = {
  title: "Споры",
};

export default async function AdminDisputesPage() {
  const disputes = await getDisputes();

  return <DisputesQueue disputes={disputes} />;
}
