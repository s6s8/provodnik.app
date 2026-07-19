import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Uuid } from "@/lib/supabase/types";

export type LocationCatalogEntry = {
  id: Uuid;
  name: string;
  status: "active" | "retired";
};

/**
 * Active canonical locations guides pick from (item 3). Browser client by default so
 * the guide authoring UI can read it; RLS exposes the catalogue to everyone (read-only).
 */
export async function listActiveLocations(
  client: SupabaseClient = createSupabaseBrowserClient(),
): Promise<LocationCatalogEntry[]> {
  const { data, error } = await client
    .from("guide_location_catalog")
    .select("id, name, status")
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationCatalogEntry[];
}

/** Every location in every status — admin catalogue management. Service-role client. */
export async function listAllLocations(
  adminClient: SupabaseClient,
): Promise<LocationCatalogEntry[]> {
  const { data, error } = await adminClient
    .from("guide_location_catalog")
    .select("id, name, status")
    .order("status", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationCatalogEntry[];
}

export async function createLocation(
  adminClient: SupabaseClient,
  name: string,
  createdBy: string,
): Promise<void> {
  const { error } = await adminClient
    .from("guide_location_catalog")
    .insert({ name, status: "active", created_by: createdBy });
  if (error) throw new Error(error.message);
}

export async function setLocationStatus(
  adminClient: SupabaseClient,
  id: string,
  status: "active" | "retired",
): Promise<void> {
  const { error } = await adminClient
    .from("guide_location_catalog")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
