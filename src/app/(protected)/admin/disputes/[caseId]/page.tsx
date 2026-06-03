import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DisputeCaseDetail } from "@/features/admin/components/disputes/dispute-case-detail";
import { getDispute } from "@/lib/supabase/disputes";
import { requireAdminSession } from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Детали спора",
};

export default async function AdminDisputeCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { adminId } = await requireAdminSession();
  const dispute = await getDispute(caseId);
  if (!dispute) {
    notFound();
  }

  return <DisputeCaseDetail dispute={dispute} adminId={adminId} />;
}
