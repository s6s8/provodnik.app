import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COPY } from "@/lib/copy";
import { formatRussianDateTime } from "@/lib/dates";
import {
  GUIDE_LISTINGS_LIMIT,
  type GuideListingRow,
} from "@/lib/supabase/admin-listings";
import { PUBLIC_LISTING_STATUS, type ListingStatusDb } from "@/lib/supabase/types";

const STATUS_LABELS: Record<ListingStatusDb, string> = {
  draft: COPY.status.draft,
  published: COPY.status.published,
  // Legacy alias of `published` (see PUBLIC_LISTING_STATUS) — same label.
  active: COPY.status.published,
  pending_review: COPY.status.pending,
  paused: COPY.status.paused,
  rejected: COPY.status.rejected,
  archived: "В архиве",
};

const STATUS_VARIANTS: Record<
  ListingStatusDb,
  "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
  draft: "outline",
  published: "success",
  active: "success",
  pending_review: "warning",
  paused: "secondary",
  rejected: "destructive",
  archived: "secondary",
};

export function summarizeGuideListings(listings: GuideListingRow[]) {
  return {
    total: listings.length,
    published: listings.filter(
      (listing) =>
        listing.status === PUBLIC_LISTING_STATUS || listing.status === "active",
    ).length,
    pending: listings.filter((listing) => listing.status === "pending_review").length,
    drafts: listings.filter((listing) => listing.status === "draft").length,
  };
}

export function GuideListingsPanel({ listings }: { listings: GuideListingRow[] }) {
  const counts = summarizeGuideListings(listings);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Экскурсии гида</CardTitle>
          <span className="text-sm text-muted-foreground">
            {`Всего: ${counts.total} · опубликовано: ${counts.published} · на модерации: ${counts.pending} · черновики: ${counts.drafts}`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">У гида пока нет экскурсий.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создана</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium text-foreground">
                    {listing.status === "pending_review" ? (
                      <Link href="/admin/moderation" className="underline underline-offset-4">
                        {listing.title}
                      </Link>
                    ) : (
                      listing.title
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[listing.status]}>
                      {STATUS_LABELS[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRussianDateTime(listing.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {listings.length === GUIDE_LISTINGS_LIMIT ? (
          <p className="text-sm text-muted-foreground">
            {`показаны первые ${GUIDE_LISTINGS_LIMIT}`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
