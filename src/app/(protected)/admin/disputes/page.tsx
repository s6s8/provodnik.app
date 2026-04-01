import { redirect } from "next/navigation";

import { DisputesQueue } from "@/features/admin/components/disputes/disputes-queue";
import { getDisputes } from "@/lib/supabase/disputes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDisputesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin");

  const disputes = await getDisputes();

  return <DisputesQueue disputes={disputes} />;
}

