import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExcursionShapeDetail, type ListingDetailRow } from "@/components/listing-detail/ExcursionShapeDetail";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function listingRefIsUuid(ref: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: ref } = await params;
  const supabase = await createSupabaseServerClient();
  const base = supabase.from("listings").select("title, description").eq("status", "active");
  const { data } = listingRefIsUuid(ref)
    ? await base.eq("id", ref).maybeSingle()
    : await base.eq("slug", ref).maybeSingle();

  const safeDesc = data?.description ? maskPii(data.description).slice(0, 160) : "";

  return {
    title: data?.title ?? "Предложение",
    description: safeDesc,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ref } = await params;
  const supabase = await createSupabaseServerClient();
  const auth = await readAuthContextFromServer();

  const listingQuery = supabase.from("listings").select("*").eq("status", "active");
  const { data: listingRaw } = listingRefIsUuid(ref)
    ? await listingQuery.eq("id", ref).maybeSingle()
    : await listingQuery.eq("slug", ref).maybeSingle();

  if (!listingRaw) notFound();

  const listing = listingRaw as ListingDetailRow;
  const id = listing.id;

  if (listing.exp_type === "transfer") {
    const { default: TransferPage } = await import("./transfer/page");
    return <TransferPage params={params} />;
  }

  const [photosRes, scheduleRes, tariffsRes, guideRes] = await Promise.all([
    supabase.from("listing_photos").select("*").eq("listing_id", id).order("position"),
    supabase.from("listing_schedule").select("*").eq("listing_id", id).order("weekday"),
    supabase.from("listing_tariffs").select("*").eq("listing_id", id),
    supabase
      .from("guide_profiles")
      .select("user_id, slug, display_name, bio, average_rating, review_count, contact_visibility_unlocked")
      .eq("user_id", listing.guide_id)
      .maybeSingle(),
  ]);

  const photos = photosRes.data ?? [];
  const schedule = scheduleRes.data ?? [];
  const tariffs = tariffsRes.data ?? [];
  const guide = guideRes.data;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeader
        isAuthenticated={auth.isAuthenticated}
        role={auth.role}
        email={auth.email}
        canonicalRedirectTo={auth.canonicalRedirectTo}
      />
      <main className="pt-nav-h">
        <ExcursionShapeDetail
          listing={listing}
          photos={photos}
          schedule={schedule}
          tariffs={tariffs}
          guide={guide}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
