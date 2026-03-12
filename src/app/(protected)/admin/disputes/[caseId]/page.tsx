import { DisputeCaseDetail } from "@/features/admin/components/disputes/dispute-case-detail";

export default async function AdminDisputeCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <DisputeCaseDetail caseId={caseId} />;
}

