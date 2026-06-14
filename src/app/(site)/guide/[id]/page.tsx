import { notFound, permanentRedirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LegacyGuideRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guide_profiles")
    .select("slug")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;

  const guideSlug = data?.slug;

  if (!guideSlug) {
    notFound();
  }

  permanentRedirect(`/guides/${guideSlug}`);
}
