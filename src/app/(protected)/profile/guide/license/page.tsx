import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  LicenseManager,
  type GuideLicenseView,
  type GuideListingOption,
} from "@/features/profile/components/LicenseManager";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingStatusDb } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Лицензии",
};

const SCOPABLE_LISTING_STATUSES: ListingStatusDb[] = [
  "draft",
  "published",
  "paused",
  "pending_review",
  "active",
];

export default async function GuideLicenseProfilePage() {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/profile/guide/license");
  }

  if (auth.role && auth.role !== "guide") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  let licenses: GuideLicenseView[] = [];
  let listings: GuideListingOption[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/profile/guide/license");
    }

    const { data: licenseRows } = await supabase
      .from("guide_licenses")
      .select("id, license_type, license_number, issued_by, valid_until, scope_mode")
      .eq("guide_id", user.id)
      .order("created_at", { ascending: false });

    const { data: listingRows } = await supabase
      .from("listings")
      .select("id, title, status")
      .eq("guide_id", user.id)
      .in("status", SCOPABLE_LISTING_STATUSES)
      .order("title", { ascending: true });

    listings =
      listingRows?.map((l) => ({
        id: l.id,
        title: l.title,
      })) ?? [];

    const licenseIds = (licenseRows ?? []).map((r) => r.id);
    const titleById = new Map(listings.map((l) => [l.id, l.title] as const));

    let links: { license_id: string; listing_id: string }[] = [];
    if (licenseIds.length > 0) {
      const { data: linkRows } = await supabase
        .from("listing_licenses")
        .select("license_id, listing_id")
        .in("license_id", licenseIds);
      links = linkRows ?? [];
    }

    const titlesByLicense = new Map<string, string[]>();
    for (const row of links) {
      const title = titleById.get(row.listing_id);
      if (!title) continue;
      const arr = titlesByLicense.get(row.license_id) ?? [];
      arr.push(title);
      titlesByLicense.set(row.license_id, arr);
    }

    licenses =
      licenseRows?.map((row) => {
        const scopeMode = row.scope_mode === "all" ? "all" : "selected";
        return {
          id: row.id,
          licenseType: row.license_type,
          licenseNumber: row.license_number,
          issuedBy: row.issued_by,
          validUntil: row.valid_until,
          scopeMode,
          listingTitles: titlesByLicense.get(row.id) ?? [],
        };
      }) ?? [];
  } catch {
    // Supabase unavailable — empty state; manager still renders add flow may fail at submit
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-4">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">Лицензии гида</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Укажите документы и к каким предложениям они относятся.
        </p>
      </div>
      <LicenseManager licenses={licenses} listings={listings} />
    </div>
  );
}
