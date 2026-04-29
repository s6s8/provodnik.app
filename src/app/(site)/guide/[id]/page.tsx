import { notFound, permanentRedirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LegacyGuideRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("guide_profiles")
    .select("slug")
    .eq("user_id", id)
    .maybeSingle();

  if (!data?.slug) {
    notFound();
  }

  permanentRedirect(`/guides/${data.slug}`);
}
