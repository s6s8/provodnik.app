import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Предложение принято!",
};

export default async function TravelerRequestAcceptedPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ booking_id?: string }>;
}) {
  const { requestId } = await params;
  const { booking_id } = await searchParams;

  if (!booking_id) {
    redirect(`/traveler/requests/${requestId}`);
  }

  permanentRedirect(`/bookings/${booking_id}`);
}

