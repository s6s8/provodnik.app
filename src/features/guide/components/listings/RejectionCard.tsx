"use client";

import type { ListingRow } from "@/lib/supabase/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RejectionCardProps = {
  listing: Pick<ListingRow, "id" | "title" | "status" | "rejection_reason">;
};

export function RejectionCard({ listing }: RejectionCardProps) {
  if (listing.status !== "rejected") {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Объявление отклонено</AlertTitle>
      <AlertDescription>
        {listing.rejection_reason ?? "Причина не указана"}
      </AlertDescription>
      <Button asChild size="sm" className="mt-2" variant="outline">
        <a href={`/guide/listings/${listing.id}/edit`}>
          Редактировать и переотправить
        </a>
      </Button>
    </Alert>
  );
}
