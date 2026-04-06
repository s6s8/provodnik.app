import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DisputeCaseDetail } from "@/features/admin/components/disputes/dispute-case-detail";
import { getDispute } from "@/lib/supabase/disputes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Детали спора",
};

export default async function AdminDisputeCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/admin");
  }

  const dispute = await getDispute(caseId);
  if (!dispute) {
    notFound();
  }

  return <DisputeCaseDetail dispute={dispute} adminId={user.id} />;
}

