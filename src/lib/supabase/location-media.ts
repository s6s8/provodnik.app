import type { SupabaseClient } from "@supabase/supabase-js";

import type { Uuid } from "@/lib/supabase/types";

export const LOCATION_MEDIA_BUCKET = "location-media" as const;

/** Long enough for an admin to work through a page of media, short enough to expire. */
const LOCATION_MEDIA_URL_TTL_SECONDS = 60 * 60;

export type LocationMediaRole = "cover" | "gallery";
/** `uploading` = row reserved before the signed upload URL was issued; never public. */
export type LocationMediaStatus = "uploading" | "draft" | "published";

export type LocationMediaRecord = {
  id: Uuid;
  locationId: Uuid;
  bucketId: string;
  objectPath: string;
  /** Short-lived signed URL; null when the object is missing (upload never completed). */
  signedUrl: string | null;
  role: LocationMediaRole;
  status: LocationMediaStatus;
  isPrimary: boolean;
  altText: string | null;
  caption: string | null;
  source: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  sortOrder: number;
  createdAt: string;
};

type LocationMediaRow = {
  id: string;
  location_id: string;
  bucket_id: string;
  object_path: string;
  role: LocationMediaRole;
  status: LocationMediaStatus;
  is_primary: boolean;
  alt_text: string | null;
  caption: string | null;
  source: string | null;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
};

const MEDIA_COLUMNS =
  "id, location_id, bucket_id, object_path, role, status, is_primary, alt_text, caption, source, mime_type, byte_size, width, height, sort_order, created_at";

/**
 * The bucket is private, so a URL has to be signed by a caller the object policy admits:
 * an admin for anything, or any client for a published primary cover. Signing is best
 * effort per path — a row whose upload never landed simply has no URL.
 */
async function signLocationMediaUrls(
  client: SupabaseClient,
  objects: readonly { bucketId: string; objectPath: string }[],
): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  const byBucket = new Map<string, string[]>();
  for (const { bucketId, objectPath } of objects) {
    const paths = byBucket.get(bucketId) ?? [];
    paths.push(objectPath);
    byBucket.set(bucketId, paths);
  }

  for (const [bucketId, paths] of byBucket) {
    const { data } = await client.storage
      .from(bucketId)
      .createSignedUrls(paths, LOCATION_MEDIA_URL_TTL_SECONDS);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(signedKey(bucketId, entry.path), entry.signedUrl);
    }
  }
  return signed;
}

function signedKey(bucketId: string, objectPath: string) {
  return `${bucketId}\n${objectPath}`;
}

function toRecord(row: LocationMediaRow, signed: Map<string, string>): LocationMediaRecord {
  return {
    id: row.id,
    locationId: row.location_id,
    bucketId: row.bucket_id,
    objectPath: row.object_path,
    signedUrl: signed.get(signedKey(row.bucket_id, row.object_path)) ?? null,
    role: row.role,
    status: row.status,
    isPrimary: row.is_primary,
    altText: row.alt_text,
    caption: row.caption,
    source: row.source,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/** Every asset for one location, drafts included. Admin (service-role) client only. */
export async function listLocationMedia(
  adminClient: SupabaseClient,
  locationId: string,
): Promise<LocationMediaRecord[]> {
  const { data, error } = await adminClient
    .from("location_media")
    .select(MEDIA_COLUMNS)
    .eq("location_id", locationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as LocationMediaRow[];
  const signed = await signLocationMediaUrls(
    adminClient,
    rows.map((row) => ({ bucketId: row.bucket_id, objectPath: row.object_path })),
  );
  return rows.map((row) => toRecord(row, signed));
}

export async function getLocation(
  adminClient: SupabaseClient,
  locationId: string,
): Promise<{ id: Uuid; name: string; status: "active" | "retired" } | null> {
  const { data, error } = await adminClient
    .from("guide_location_catalog")
    .select("id, name, status")
    .eq("id", locationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { id: Uuid; name: string; status: "active" | "retired" } | null) ?? null;
}

/**
 * Reserves the row *before* the signed upload URL is issued, as `uploading`.
 *
 * The order matters: if the browser dies between the signed URL and confirmation, the
 * storage object is still owned by a row an admin can see and cancel. Reserving after the
 * upload instead would leave unmanaged objects nobody can enumerate.
 */
export async function beginLocationMediaUpload(
  adminClient: SupabaseClient,
  input: {
    locationId: string;
    objectPath: string;
    role: LocationMediaRole;
    mimeType: string;
    byteSize: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    caption: string | null;
    source: string | null;
    createdBy: string;
  },
): Promise<Uuid> {
  const { data, error } = await adminClient
    .from("location_media")
    .insert({
      location_id: input.locationId,
      bucket_id: LOCATION_MEDIA_BUCKET,
      object_path: input.objectPath,
      role: input.role,
      status: "uploading",
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      width: input.width,
      height: input.height,
      alt_text: input.altText,
      caption: input.caption,
      source: input.source,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Не удалось сохранить медиа.");
  return (data as { id: Uuid }).id;
}

/** Promotes a reserved row to `draft` once its bytes are in storage. */
export async function confirmLocationMediaUpload(
  adminClient: SupabaseClient,
  id: string,
): Promise<void> {
  const { data, error } = await adminClient
    .from("location_media")
    .update({ status: "draft" })
    .eq("id", id)
    .eq("status", "uploading")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Загрузка не найдена или уже подтверждена.");
}

async function getMediaObject(
  adminClient: SupabaseClient,
  id: string,
): Promise<{ bucket_id: string; object_path: string } | null> {
  const { data, error } = await adminClient
    .from("location_media")
    .select("bucket_id, object_path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { bucket_id: string; object_path: string } | null) ?? null;
}

/**
 * Removes the backing object, failing loudly. Supabase does not report removing a path
 * that holds no bytes as an error, so the "file never left the browser" case still
 * cleans up; anything that *is* an error must keep the row, and with it the path.
 */
async function removeMediaObject(
  adminClient: SupabaseClient,
  object: { bucket_id: string; object_path: string },
): Promise<void> {
  const { error } = await adminClient.storage
    .from(object.bucket_id)
    .remove([object.object_path]);
  if (error) throw new Error(`Файл не удалён из хранилища: ${error.message}`);
}

/**
 * Cancels a reserved upload. As strict as a normal delete: an abandoned upload is the
 * common case and cleans up silently, but a real storage failure must not drop the only
 * row that knows the object exists.
 */
export async function cancelLocationMediaUpload(
  adminClient: SupabaseClient,
  id: string,
): Promise<void> {
  const object = await getMediaObject(adminClient, id);
  if (!object) return;

  await removeMediaObject(adminClient, object);

  const { error } = await adminClient
    .from("location_media")
    .delete()
    .eq("id", id)
    .eq("status", "uploading");
  if (error) throw new Error(error.message);
}

export async function updateLocationMedia(
  adminClient: SupabaseClient,
  id: string,
  patch: {
    altText?: string | null;
    caption?: string | null;
    source?: string | null;
    role?: LocationMediaRole;
    status?: LocationMediaStatus;
    isPrimary?: boolean;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if ("altText" in patch) row.alt_text = patch.altText;
  if ("caption" in patch) row.caption = patch.caption;
  if ("source" in patch) row.source = patch.source;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.isPrimary !== undefined) row.is_primary = patch.isPrimary;
  // ponytail: no reorder writer yet — `sort_order` only gives list reads a stable
  // order. Add one here when the console grows drag-to-reorder.
  if (Object.keys(row).length === 0) return;

  // An `uploading` row has no confirmed bytes behind it, so no edit — least of all
  // publishing it — may apply until confirmLocationMediaUpload has moved it to draft.
  const { error } = await adminClient
    .from("location_media")
    .update(row)
    .eq("id", id)
    .neq("status", "uploading");
  if (error) throw new Error(error.message);
}

/**
 * Deletes the storage object first, then its row.
 *
 * Order and strictness are both deliberate: dropping the row first and then failing to
 * remove the object leaves a file no query can find. Failing loudly instead keeps the
 * record — and therefore the object path — recoverable, so the admin can retry.
 */
export async function deleteLocationMedia(
  adminClient: SupabaseClient,
  id: string,
): Promise<void> {
  const object = await getMediaObject(adminClient, id);
  if (!object) return;

  await removeMediaObject(adminClient, object);

  const { error } = await adminClient.from("location_media").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Published primary covers keyed by lower-cased location name — the public request
 * surfaces match on the free-text destination label, not a foreign key.
 *
 * ponytail: reads every published primary cover (one row per canonical location, tens
 * of rows today). Filter by the requested destinations if the catalogue passes ~500.
 */
export async function getPublishedLocationCovers(
  client: SupabaseClient,
): Promise<Map<string, string>> {
  const { data, error } = await client
    .from("location_media")
    .select("bucket_id, object_path, guide_location_catalog!inner(name)")
    .eq("status", "published")
    .eq("role", "cover")
    .eq("is_primary", true);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as {
    bucket_id: string;
    object_path: string;
    guide_location_catalog: { name: string } | { name: string }[] | null;
  }[];
  // Signing is what the object SELECT policy gates, so an unpublished or demoted row can
  // never yield a URL even if it somehow reached this list.
  const signed = await signLocationMediaUrls(
    client,
    rows.map((row) => ({ bucketId: row.bucket_id, objectPath: row.object_path })),
  );

  const covers = new Map<string, string>();
  for (const row of rows) {
    const relation = Array.isArray(row.guide_location_catalog)
      ? row.guide_location_catalog[0]
      : row.guide_location_catalog;
    if (!relation?.name) continue;
    const url = signed.get(signedKey(row.bucket_id, row.object_path));
    if (!url) continue;
    covers.set(relation.name.trim().toLocaleLowerCase("ru-RU"), url);
  }
  return covers;
}

/** Published cover for a destination label, or null so callers keep the branded fallback. */
export function resolveLocationCover(
  covers: Map<string, string>,
  destination: string | null | undefined,
): string | null {
  if (!destination) return null;
  return covers.get(destination.trim().toLocaleLowerCase("ru-RU")) ?? null;
}

/** Never throws: a media outage must not take the public marketplace down. */
export async function getPublishedLocationCoversSafe(
  client: SupabaseClient,
): Promise<Map<string, string>> {
  try {
    return await getPublishedLocationCovers(client);
  } catch {
    return new Map();
  }
}
