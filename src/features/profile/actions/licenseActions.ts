"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingStatusDb } from "@/lib/supabase/types";

const SCOPABLE_LISTING_STATUSES: ListingStatusDb[] = [
  "draft",
  "published",
  "paused",
  "pending_review",
  "active",
];

export async function addLicense(data: {
  licenseType: string;
  licenseNumber: string;
  issuedBy: string;
  validUntil: string | null;
  scope: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const applyAll = data.scope === "all";
  const scopeMode = applyAll ? "all" : "selected";

  const { data: inserted, error: insertError } = await supabase
    .from("guide_licenses")
    .insert({
      guide_id: user.id,
      license_type: data.licenseType.trim(),
      license_number: data.licenseNumber.trim(),
      issued_by: data.issuedBy.trim(),
      valid_until: data.validUntil?.trim() || null,
      scope_mode: scopeMode,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Не удалось сохранить лицензию");
  }

  const licenseId = inserted.id;

  let listingIds: string[] = [];
  if (applyAll) {
    const { data: listings, error: listErr } = await supabase
      .from("listings")
      .select("id")
      .eq("guide_id", user.id)
      .in("status", SCOPABLE_LISTING_STATUSES);

    if (listErr) {
      await supabase.from("guide_licenses").delete().eq("id", licenseId);
      throw new Error(listErr.message);
    }
    listingIds = (listings ?? []).map((r) => r.id);
  } else {
    listingIds = data.scope
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (listingIds.length > 0) {
    const { data: owned, error: ownErr } = await supabase
      .from("listings")
      .select("id")
      .eq("guide_id", user.id)
      .in("id", listingIds);

    if (ownErr) {
      await supabase.from("guide_licenses").delete().eq("id", licenseId);
      throw new Error(ownErr.message);
    }

    const ownedIds = new Set((owned ?? []).map((r) => r.id));
    for (const id of listingIds) {
      if (!ownedIds.has(id)) {
        await supabase.from("guide_licenses").delete().eq("id", licenseId);
        throw new Error("Недопустимое предложение в области действия");
      }
    }

    const scopeCell = applyAll ? "all" : listingIds.join(",");
    const rows = listingIds.map((listing_id) => ({
      listing_id,
      license_id: licenseId,
      scope: scopeCell,
    }));

    const { error: linkErr } = await supabase.from("listing_licenses").insert(rows);
    if (linkErr) {
      await supabase.from("guide_licenses").delete().eq("id", licenseId);
      throw new Error(linkErr.message);
    }
  }

  return { success: true as const };
}

export async function deleteLicense(licenseId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("guide_licenses")
    .delete()
    .eq("id", licenseId)
    .eq("guide_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true as const };
}
