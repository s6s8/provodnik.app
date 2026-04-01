import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuideListing } from "@/lib/supabase/listings";
import { GuideListingEditPageClient } from "@/features/guide/components/listings/guide-listing-edit-page-client";
import { updateListingAction } from "../../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GuideListingEditPage({ params }: Props) {
  const { id } = await params;

  let defaultValues = {};

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return notFound();
    }

    const listing = await getGuideListing(id, session.user.id);

    if (!listing) {
      return notFound();
    }

    const durationDays =
      listing.duration_minutes !== null
        ? Math.max(1, Math.round(listing.duration_minutes / 60 / 24))
        : 1;

    defaultValues = {
      title: listing.title,
      description: listing.description ?? "",
      destination: listing.region,
      price_per_person: Math.round(listing.price_from_minor / 100),
      max_group_size: listing.max_group_size,
      duration_days: durationDays,
      included: listing.inclusions?.join(", ") ?? "",
      excluded: listing.exclusions?.join(", ") ?? "",
    };
  } catch {
    // Supabase not configured — show empty form
  }

  return (
    <GuideListingEditPageClient
      listingId={id}
      defaultValues={defaultValues}
      updateAction={updateListingAction}
    />
  );
}
