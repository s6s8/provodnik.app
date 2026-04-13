import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DisputeThread } from "@/features/disputes/components/DisputeThread";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Спор",
};

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!flags.FEATURE_TR_DISPUTES) notFound();

  const { id } = await params;
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

  const { data: dispute, error } = await supabase
    .from("disputes")
    .select("id, opened_by")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!dispute) notFound();

  const isAdmin = profile?.role === "admin";
  if (dispute.opened_by !== user.id && !isAdmin) {
    notFound();
  }

  return (
    <DisputeThread
      disputeId={id}
      adminView={isAdmin}
      adminId={isAdmin ? user.id : undefined}
    />
  );
}
