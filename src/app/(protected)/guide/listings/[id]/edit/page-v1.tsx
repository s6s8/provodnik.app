import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingEditorShell } from "@/features/guide/components/listings/ListingEditorV1";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuideListing } from "@/lib/supabase/listings";
export const metadata: Metadata = {
  title: "Редактировать тур",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GuideListingEditPageV1({ params }: Props) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    notFound();
  }

  const userId = session.user.id;
  const listing = await getGuideListing(id, userId);

  if (!listing) {
    notFound();
  }

  return <ListingEditorShell listing={listing} userId={userId} />;
}
