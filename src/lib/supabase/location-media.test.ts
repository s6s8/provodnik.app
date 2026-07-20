import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  beginLocationMediaUpload,
  cancelLocationMediaUpload,
  confirmLocationMediaUpload,
  deleteLocationMedia,
  getPublishedLocationCovers,
  getPublishedLocationCoversSafe,
  listLocationMedia,
  resolveLocationCover,
  updateLocationMedia,
} from "./location-media";

type Row = Record<string, unknown>;

function stubClient({
  rows = [] as Row[],
  error = null as { message: string } | null,
  /** Paths the bucket refuses to sign — i.e. objects that are not readable or not there. */
  unsignable = [] as string[],
  removeError = null as { message: string } | null,
} = {}) {
  const filters: Record<string, unknown> = {};
  const excluded: Record<string, unknown> = {};
  const updates: Row[] = [];
  const inserts: Row[] = [];
  const deleted: string[][] = [];
  const signRequests: string[][] = [];

  let rowDeletes = 0;
  const query: Record<string, unknown> = {};
  for (const method of ["select", "order"]) {
    query[method] = () => query;
  }
  query.delete = () => {
    rowDeletes += 1;
    return query;
  };
  query.insert = (row: Row) => {
    inserts.push(row);
    return query;
  };
  query.eq = (column: string, value: unknown) => {
    filters[column] = value;
    return query;
  };
  query.neq = (column: string, value: unknown) => {
    excluded[column] = value;
    return query;
  };
  query.update = (patch: Row) => {
    updates.push(patch);
    return query;
  };
  query.maybeSingle = () => Promise.resolve({ data: rows[0] ?? null, error });
  query.single = () => Promise.resolve({ data: rows[0] ?? null, error });
  query.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error });

  const client = {
    from: vi.fn(() => query),
    storage: {
      from: (bucket: string) => ({
        createSignedUrls: (paths: string[]) => {
          signRequests.push(paths);
          return Promise.resolve({
            data: paths.map((path) =>
              unsignable.includes(path)
                ? { path, signedUrl: null, error: "Object not found" }
                : { path, signedUrl: `https://signed.test/${bucket}/${path}`, error: null },
            ),
            error: null,
          });
        },
        remove: (paths: string[]) => {
          deleted.push(paths);
          return Promise.resolve({ data: null, error: removeError });
        },
      }),
    },
  } as unknown as SupabaseClient;

  return {
    client,
    filters,
    excluded,
    updates,
    inserts,
    deleted,
    signRequests,
    rowDeletes: () => rowDeletes,
  };
}

const PUBLISHED_COVER: Row = {
  bucket_id: "location-media",
  object_path: "admin-1/cover.jpg",
  guide_location_catalog: { name: " Казань " },
};

describe("getPublishedLocationCovers", () => {
  it("only ever asks for published primary covers — drafts must not reach public pages", async () => {
    const { client, filters } = stubClient({ rows: [PUBLISHED_COVER] });

    await getPublishedLocationCovers(client);

    expect(filters).toEqual({ status: "published", role: "cover", is_primary: true });
  });

  it("keys covers by normalised location name and signs the object", async () => {
    const { client } = stubClient({ rows: [PUBLISHED_COVER] });

    const covers = await getPublishedLocationCovers(client);

    expect(covers.get("казань")).toBe(
      "https://signed.test/location-media/admin-1/cover.jpg",
    );
  });

  it("never emits an unsigned public URL", async () => {
    const { client } = stubClient({ rows: [PUBLISHED_COVER] });

    const covers = await getPublishedLocationCovers(client);

    expect([...covers.values()].every((url) => url.includes("/signed.test/"))).toBe(true);
  });

  it("drops a cover the bucket refuses to sign rather than guessing a URL", async () => {
    const { client } = stubClient({
      rows: [PUBLISHED_COVER],
      unsignable: ["admin-1/cover.jpg"],
    });

    expect((await getPublishedLocationCovers(client)).size).toBe(0);
  });

  it("tolerates the embed arriving as an array", async () => {
    const { client } = stubClient({
      rows: [{ ...PUBLISHED_COVER, guide_location_catalog: [{ name: "Сочи" }] }],
    });

    const covers = await getPublishedLocationCovers(client);

    expect(covers.has("сочи")).toBe(true);
  });

  it("skips rows whose location relation is missing", async () => {
    const { client } = stubClient({
      rows: [{ ...PUBLISHED_COVER, guide_location_catalog: null }],
    });

    expect((await getPublishedLocationCovers(client)).size).toBe(0);
  });

  it("throws on a query error so callers decide the fallback", async () => {
    const { client } = stubClient({ error: { message: "boom" } });

    await expect(getPublishedLocationCovers(client)).rejects.toThrow("boom");
  });

  it("degrades to an empty map in the safe wrapper — media must not break /requests", async () => {
    const { client } = stubClient({ error: { message: "boom" } });

    expect((await getPublishedLocationCoversSafe(client)).size).toBe(0);
  });
});

describe("resolveLocationCover", () => {
  const covers = new Map([["казань", "https://signed.test/kazan.jpg"]]);

  it("matches case- and whitespace-insensitively", () => {
    expect(resolveLocationCover(covers, "  КАЗАНЬ ")).toBe("https://signed.test/kazan.jpg");
  });

  it("returns null for an uncovered destination so the branded gradient stays", () => {
    expect(resolveLocationCover(covers, "Элиста")).toBeNull();
  });

  it("returns null for an empty destination", () => {
    expect(resolveLocationCover(covers, "")).toBeNull();
    expect(resolveLocationCover(covers, null)).toBeNull();
  });
});

const DRAFT_ROW: Row = {
  id: "m-1",
  location_id: "loc-1",
  bucket_id: "location-media",
  object_path: "admin-1/cover.webp",
  role: "cover",
  status: "draft",
  is_primary: false,
  alt_text: "Казанский кремль",
  caption: "Вид с реки",
  source: "Куратор",
  mime_type: "image/webp",
  byte_size: 204800,
  width: 1600,
  height: 900,
  sort_order: 0,
  created_at: "2026-07-20T00:00:00Z",
};

describe("listLocationMedia", () => {
  it("maps a row to a record with metadata and a signed URL", async () => {
    const { client } = stubClient({ rows: [DRAFT_ROW] });

    const [record] = await listLocationMedia(client, "loc-1");

    expect(record).toMatchObject({
      id: "m-1",
      status: "draft",
      isPrimary: false,
      altText: "Казанский кремль",
      caption: "Вид с реки",
      source: "Куратор",
      mimeType: "image/webp",
      byteSize: 204800,
      width: 1600,
      height: 900,
      signedUrl: "https://signed.test/location-media/admin-1/cover.webp",
    });
  });

  it("leaves signedUrl null when the object never landed", async () => {
    const { client } = stubClient({
      rows: [{ ...DRAFT_ROW, status: "uploading" }],
      unsignable: ["admin-1/cover.webp"],
    });

    const [record] = await listLocationMedia(client, "loc-1");

    expect(record.signedUrl).toBeNull();
  });
});

describe("beginLocationMediaUpload", () => {
  it("reserves the row as uploading so a failed upload is never unmanaged", async () => {
    const { client, inserts } = stubClient({ rows: [{ id: "m-1" }] });

    const id = await beginLocationMediaUpload(client, {
      locationId: "loc-1",
      objectPath: "admin-1/cover.jpg",
      role: "cover",
      mimeType: "image/jpeg",
      byteSize: 1024,
      width: 1600,
      height: 900,
      altText: null,
      caption: null,
      source: null,
      createdBy: "admin-1",
    });

    expect(id).toBe("m-1");
    expect(inserts[0]).toMatchObject({ status: "uploading", object_path: "admin-1/cover.jpg" });
  });
});

describe("confirmLocationMediaUpload", () => {
  it("moves the reservation to draft, and only from uploading", async () => {
    const { client, updates, filters } = stubClient({ rows: [{ id: "m-1" }] });

    await confirmLocationMediaUpload(client, "m-1");

    expect(updates).toEqual([{ status: "draft" }]);
    expect(filters).toEqual({ id: "m-1", status: "uploading" });
  });

  it("throws when there is no reservation to confirm", async () => {
    const { client } = stubClient({ rows: [] });

    await expect(confirmLocationMediaUpload(client, "m-1")).rejects.toThrow(
      "Загрузка не найдена или уже подтверждена.",
    );
  });
});

describe("cancelLocationMediaUpload", () => {
  it("removes the object and the reservation", async () => {
    const { client, deleted, filters } = stubClient({
      rows: [{ bucket_id: "location-media", object_path: "admin-1/cover.jpg" }],
    });

    await cancelLocationMediaUpload(client, "m-1");

    expect(deleted).toEqual([["admin-1/cover.jpg"]]);
    expect(filters.status).toBe("uploading");
  });

  it("keeps the row when storage removal fails, so the object stays recoverable", async () => {
    const { client, rowDeletes } = stubClient({
      rows: [{ bucket_id: "location-media", object_path: "admin-1/cover.jpg" }],
      removeError: { message: "network" },
    });

    await expect(cancelLocationMediaUpload(client, "m-1")).rejects.toThrow(
      "Файл не удалён из хранилища: network",
    );
    expect(rowDeletes()).toBe(0);
  });

  it("is a no-op when the row is already gone", async () => {
    const { client, deleted } = stubClient({ rows: [] });

    await cancelLocationMediaUpload(client, "m-1");

    expect(deleted).toEqual([]);
  });
});

describe("updateLocationMedia", () => {
  it("sends only the supplied columns", async () => {
    const { client, updates } = stubClient();

    await updateLocationMedia(client, "m-1", { status: "published", isPrimary: true });

    expect(updates).toEqual([{ status: "published", is_primary: true }]);
  });

  it("refuses to touch a row that is still uploading", async () => {
    const { client, excluded } = stubClient();

    await updateLocationMedia(client, "m-1", { status: "published" });

    expect(excluded).toEqual({ status: "uploading" });
  });

  it("writes an explicit null when metadata is cleared", async () => {
    const { client, updates } = stubClient();

    await updateLocationMedia(client, "m-1", { caption: null });

    expect(updates).toEqual([{ caption: null }]);
  });

  it("does not issue an update for an empty patch", async () => {
    const { client, updates } = stubClient();

    await updateLocationMedia(client, "m-1", {});

    expect(updates).toEqual([]);
  });
});

describe("deleteLocationMedia", () => {
  it("removes the storage object too — a dangling file is invisible waste", async () => {
    const { client, deleted } = stubClient({
      rows: [{ bucket_id: "location-media", object_path: "admin-1/cover.jpg" }],
    });

    await deleteLocationMedia(client, "m-1");

    expect(deleted).toEqual([["admin-1/cover.jpg"]]);
  });

  it("keeps the row when storage removal fails, so the object stays recoverable", async () => {
    const { client, rowDeletes } = stubClient({
      rows: [{ bucket_id: "location-media", object_path: "admin-1/cover.jpg" }],
      removeError: { message: "network" },
    });

    await expect(deleteLocationMedia(client, "m-1")).rejects.toThrow(
      "Файл не удалён из хранилища: network",
    );
    expect(rowDeletes()).toBe(0);
  });

  it("is a no-op when the row is already gone", async () => {
    const { client, deleted } = stubClient({ rows: [] });

    await deleteLocationMedia(client, "m-1");

    expect(deleted).toEqual([]);
  });
});
