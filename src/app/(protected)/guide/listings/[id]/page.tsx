import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuideListing } from "@/lib/supabase/listings";
import { GuideListingDetailScreen } from "@/features/guide/components/listings/guide-listing-detail-screen";
import {
  publishListingAction,
  pauseListingAction,
  deleteListingAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Тур",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GuideListingDetailPage({ params }: Props) {
  const { id } = await params;

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

    return (
      <GuideListingDetailScreen
        listing={listing}
        actions={{
          publishAction: publishListingAction,
          pauseAction: pauseListingAction,
          deleteAction: deleteListingAction,
        }}
      />
    );
  } catch {
    return notFound();
  }
}
