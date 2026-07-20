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

/** One recorded `from("location_media")` chain: what it did and to which rows. */
type Op = {
  kind: "select" | "insert" | "update" | "delete";
  patch?: Row;
  filters: Record<string, unknown>;
  excluded: Record<string, unknown>;
  in: Record<string, unknown>;
  notNull: string[];
};

function stubClient({
  rows = [] as Row[],
  error = null as { message: string } | null,
  /**
   * Answers for `maybeSingle`/`single`, consumed in call order — the delivery flow issues
   * several distinct single-row reads and writes per operation.
   */
  singles = null as (Row | null)[] | null,
  /** Paths the bucket refuses to sign — i.e. objects that are not readable or not there. */
  unsignable = [] as string[],
  removeError = null as { message: string } | null,
  copyError = null as { message: string } | null,
  /** Errors keyed by 1-based chain index, so one statement in a flow can fail. */
  opErrors = {} as Record<number, { message: string }>,
} = {}) {
  const ops: Op[] = [];
  const removed: string[][] = [];
  const copies: { from: string; to: string }[] = [];
  const signRequests: string[][] = [];
  let singleIndex = 0;

  function chain(): Record<string, unknown> {
    const op: Op = { kind: "select", filters: {}, excluded: {}, in: {}, notNull: [] };
    ops.push(op);
    const opError = () => opErrors[ops.length] ?? error;

    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.order = () => q;
    q.delete = () => {
      op.kind = "delete";
      return q;
    };
    q.insert = (patch: Row) => {
      op.kind = "insert";
      op.patch = patch;
      return q;
    };
    q.update = (patch: Row) => {
      op.kind = "update";
      op.patch = patch;
      return q;
    };
    q.eq = (column: string, value: unknown) => {
      op.filters[column] = value;
      return q;
    };
    q.neq = (column: string, value: unknown) => {
      op.excluded[column] = value;
      return q;
    };
    q.in = (column: string, value: unknown) => {
      op.in[column] = value;
      return q;
    };
    q.not = (column: string, operator: string) => {
      if (operator === "is") op.notNull.push(column);
      return q;
    };
    const single = () => {
      const data = singles ? (singles[singleIndex++] ?? null) : (rows[0] ?? null);
      return Promise.resolve({ data, error: opError() });
    };
    q.maybeSingle = single;
    q.single = single;
    q.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error: opError() });
    return q;
  }

  const client = {
    from: vi.fn(() => chain()),
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
          removed.push(paths);
          return Promise.resolve({ data: null, error: removeError });
        },
        copy: (from: string, to: string) => {
          copies.push({ from, to });
          return Promise.resolve({ data: copyError ? null : { path: to }, error: copyError });
        },
      }),
    },
  } as unknown as SupabaseClient;

  return {
    client,
    ops,
    removed,
    copies,
    signRequests,
    updates: () => ops.filter((op) => op.kind === "update").map((op) => op.patch),
    inserts: () => ops.filter((op) => op.kind === "insert").map((op) => op.patch),
    rowDeletes: () => ops.filter((op) => op.kind === "delete").length,
    last: () => ops[ops.length - 1],
  };
}

const PUBLISHED_COVER: Row = {
  bucket_id: "location-media",
  object_path: "admin-1/cover.jpg",
  delivery_object_path: "delivery/live-cover.jpg",
  guide_location_catalog: { name: " Казань " },
};

describe("getPublishedLocationCovers", () => {
  it("only ever asks for published primary covers with a live delivery copy", async () => {
    const { client, last } = stubClient({ rows: [PUBLISHED_COVER] });

    await getPublishedLocationCovers(client);

    expect(last().filters).toEqual({ status: "published", role: "cover", is_primary: true });
    expect(last().notNull).toEqual(["delivery_object_path"]);
  });

  it("signs the delivery copy, never the original — the original is not revocable", async () => {
    const { client, signRequests } = stubClient({ rows: [PUBLISHED_COVER] });

    const covers = await getPublishedLocationCovers(client);

    expect(signRequests).toEqual([["delivery/live-cover.jpg"]]);
    expect(signRequests.flat()).not.toContain("admin-1/cover.jpg");
    expect(covers.get("казань")).toBe(
      "https://signed.test/location-media/delivery/live-cover.jpg",
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
      unsignable: ["delivery/live-cover.jpg"],
    });

    expect((await getPublishedLocationCovers(client)).size).toBe(0);
  });

  it("skips a row whose delivery copy was already revoked", async () => {
    const { client, signRequests } = stubClient({
      rows: [{ ...PUBLISHED_COVER, delivery_object_path: null }],
    });

    expect((await getPublishedLocationCovers(client)).size).toBe(0);
    expect(signRequests.flat()).toEqual([]);
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

  it("matches a bare city", () => {
    expect(resolveLocationCover(covers, "Казань")).toBe("https://signed.test/kazan.jpg");
  });

  it("matches case- and whitespace-insensitively", () => {
    expect(resolveLocationCover(covers, "  КАЗАНЬ ")).toBe("https://signed.test/kazan.jpg");
  });

  it("matches a city with its comma-separated region label", () => {
    expect(resolveLocationCover(covers, "Казань, Татарстан")).toBe(
      "https://signed.test/kazan.jpg",
    );
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
  delivery_object_path: null,
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
    expect(inserts()[0]).toMatchObject({ status: "uploading", object_path: "admin-1/cover.jpg" });
  });
});

describe("confirmLocationMediaUpload", () => {
  it("moves the reservation to draft, and only from uploading", async () => {
    const { client, updates, last } = stubClient({ rows: [{ id: "m-1" }] });

    await confirmLocationMediaUpload(client, "m-1");

    expect(updates()).toEqual([{ status: "draft" }]);
    expect(last().filters).toEqual({ id: "m-1", status: "uploading" });
  });

  it("throws when there is no reservation to confirm", async () => {
    const { client } = stubClient({ rows: [] });

    await expect(confirmLocationMediaUpload(client, "m-1")).rejects.toThrow(
      "Загрузка не найдена или уже подтверждена.",
    );
  });

  it("cannot confirm a row a cancel already claimed — the CAS filter excludes it", async () => {
    // The stub answers the CAS `... eq(status, 'uploading')` with no row, which is exactly
    // what Postgres returns once cancel has moved the row to `cancelling`.
    const { client } = stubClient({ singles: [null] });

    await expect(confirmLocationMediaUpload(client, "m-1")).rejects.toThrow(
      "Загрузка не найдена или уже подтверждена.",
    );
  });
});

const RESERVED = { bucket_id: "location-media", object_path: "admin-1/cover.jpg" };

describe("cancelLocationMediaUpload", () => {
  it("claims the row by CAS out of uploading before removing a single byte", async () => {
    const { client, ops, removed } = stubClient({ singles: [RESERVED] });

    await cancelLocationMediaUpload(client, "m-1");

    // Statement 1 is the CAS, and it is the only thing gating the storage removal.
    expect(ops[0]).toMatchObject({
      kind: "update",
      patch: { status: "cancelling" },
      filters: { id: "m-1", status: "uploading" },
    });
    expect(removed).toEqual([["admin-1/cover.jpg"]]);
  });

  it("deletes the cancelling row, not the uploading one — confirm cannot resurrect it", async () => {
    const { client, ops } = stubClient({ singles: [RESERVED] });

    await cancelLocationMediaUpload(client, "m-1");

    expect(ops[ops.length - 1]).toMatchObject({
      kind: "delete",
      filters: { id: "m-1", status: "cancelling" },
    });
  });

  it("is a silent no-op when a concurrent confirm won the CAS", async () => {
    const { client, removed, rowDeletes } = stubClient({ singles: [null] });

    await cancelLocationMediaUpload(client, "m-1");

    // The decisive assertion: a lost race must not delete the bytes of a row that is now
    // a confirmed draft.
    expect(removed).toEqual([]);
    expect(rowDeletes()).toBe(0);
  });

  it("leaves a recoverable cancelling row when storage removal fails", async () => {
    const { client, rowDeletes } = stubClient({
      singles: [RESERVED],
      removeError: { message: "network" },
    });

    await expect(cancelLocationMediaUpload(client, "m-1")).rejects.toThrow(
      "Файл не удалён из хранилища: network",
    );
    expect(rowDeletes()).toBe(0);
  });

  it("surfaces a CAS error rather than assuming the row was already confirmed", async () => {
    const { client, removed } = stubClient({ singles: [RESERVED], opErrors: { 1: { message: "boom" } } });

    await expect(cancelLocationMediaUpload(client, "m-1")).rejects.toThrow("boom");
    expect(removed).toEqual([]);
  });
});

const DRAFT_STATE: Row = {
  id: "m-1",
  location_id: "loc-1",
  bucket_id: "location-media",
  object_path: "admin-1/cover.jpg",
  delivery_object_path: null,
  status: "draft",
};
const PRIMARY_STATE: Row = {
  ...DRAFT_STATE,
  delivery_object_path: "delivery/old.jpg",
  status: "published",
};

describe("updateLocationMedia", () => {
  it("sends only the supplied columns", async () => {
    const { client, updates } = stubClient({ singles: [DRAFT_STATE] });

    await updateLocationMedia(client, "m-1", { caption: "Вид" });

    expect(updates()).toEqual([{ caption: "Вид" }]);
  });

  it("refuses to touch a row that is still uploading", async () => {
    const { client, updates } = stubClient({ singles: [{ ...DRAFT_STATE, status: "uploading" }] });

    await updateLocationMedia(client, "m-1", { status: "published" });

    expect(updates()).toEqual([]);
  });

  it("refuses to touch a row a cancel is tearing down", async () => {
    const { client, updates } = stubClient({ singles: [{ ...DRAFT_STATE, status: "cancelling" }] });

    await updateLocationMedia(client, "m-1", { status: "published" });

    expect(updates()).toEqual([]);
  });

  it("writes an explicit null when metadata is cleared", async () => {
    const { client, updates } = stubClient({ singles: [DRAFT_STATE] });

    await updateLocationMedia(client, "m-1", { caption: null });

    expect(updates()).toEqual([{ caption: null }]);
  });

  it("does not issue an update — or even a read — for an empty patch", async () => {
    const { client, ops } = stubClient();

    await updateLocationMedia(client, "m-1", {});

    expect(ops).toEqual([]);
  });

  it("copies the original into a fresh delivery object when promoting to primary", async () => {
    const { client, copies, updates } = stubClient({ singles: [DRAFT_STATE, null] });

    await updateLocationMedia(client, "m-1", {
      status: "published",
      role: "cover",
      isPrimary: true,
    });

    expect(copies).toHaveLength(1);
    expect(copies[0].from).toBe("admin-1/cover.jpg");
    expect(copies[0].to).toMatch(/^delivery\/[0-9a-f-]{36}\.jpg$/);
    expect(updates()[updates().length - 1]).toMatchObject({
      status: "published",
      is_primary: true,
      delivery_object_path: copies[0].to,
    });
  });

  it("revokes the outgoing primary's copy before serving the new one", async () => {
    const sibling = {
      id: "m-2",
      bucket_id: "location-media",
      delivery_object_path: "delivery/sibling.jpg",
    };
    const { client, removed, copies } = stubClient({ singles: [DRAFT_STATE, sibling] });

    await updateLocationMedia(client, "m-1", { isPrimary: true });

    // Without this, the trigger demotes the sibling row while its bytes keep serving.
    expect(removed).toEqual([["delivery/sibling.jpg"]]);
    expect(copies).toHaveLength(1);
  });

  it("rotates its own copy on re-promotion so old signed URLs die", async () => {
    const { client, removed, copies } = stubClient({ singles: [PRIMARY_STATE, null] });

    await updateLocationMedia(client, "m-1", { isPrimary: true });

    expect(removed).toEqual([["delivery/old.jpg"]]);
    expect(copies[0].to).not.toBe("delivery/old.jpg");
  });

  it("deletes the delivery bytes before unpublishing, and clears the column", async () => {
    const { client, removed, updates } = stubClient({ singles: [PRIMARY_STATE] });

    await updateLocationMedia(client, "m-1", { status: "draft", isPrimary: false });

    expect(removed).toEqual([["delivery/old.jpg"]]);
    expect(updates()[updates().length - 1]).toMatchObject({
      status: "draft",
      is_primary: false,
      delivery_object_path: null,
    });
  });

  it("revokes when demoting a primary to gallery", async () => {
    const { client, removed } = stubClient({ singles: [PRIMARY_STATE] });

    await updateLocationMedia(client, "m-1", { role: "gallery" });

    expect(removed).toEqual([["delivery/old.jpg"]]);
  });

  it("leaves the publish state untouched when revocation fails", async () => {
    const { client, updates } = stubClient({
      singles: [PRIMARY_STATE],
      removeError: { message: "network" },
    });

    await expect(
      updateLocationMedia(client, "m-1", { status: "draft", isPrimary: false }),
    ).rejects.toThrow("Публичная копия не отозвана: network");
    // Nothing was written, so the row is still published — a caller sees the failure and
    // the cover keeps serving from an object that is still tracked and still revocable.
    expect(updates()).toEqual([]);
  });

  it("does not publish when the delivery copy cannot be created", async () => {
    const { client, updates } = stubClient({
      singles: [DRAFT_STATE, null],
      copyError: { message: "quota" },
    });

    await expect(updateLocationMedia(client, "m-1", { isPrimary: true })).rejects.toThrow(
      "Публичная копия не создана: quota",
    );
    expect(updates()).toEqual([]);
  });

  it("removes the orphaned copy when the promoting write fails", async () => {
    // Chain 1 = state read, 2 = sibling read, 3 = the final update.
    const { client, removed, copies } = stubClient({
      singles: [DRAFT_STATE, null],
      opErrors: { 3: { message: "conflict" } },
    });

    await expect(updateLocationMedia(client, "m-1", { isPrimary: true })).rejects.toThrow(
      "conflict",
    );
    expect(removed).toEqual([[copies[0].to]]);
  });

  it("leaves a published cover's copy alone for a metadata-only edit", async () => {
    const { client, removed, copies } = stubClient({ singles: [PRIMARY_STATE] });

    await updateLocationMedia(client, "m-1", { caption: "Новая подпись" });

    expect(removed).toEqual([]);
    expect(copies).toEqual([]);
  });
});

describe("deleteLocationMedia", () => {
  it("revokes the delivery copy first, then removes the original", async () => {
    const { client, removed } = stubClient({ singles: [PRIMARY_STATE] });

    await deleteLocationMedia(client, "m-1");

    expect(removed).toEqual([["delivery/old.jpg"], ["admin-1/cover.jpg"]]);
  });

  it("removes the storage object too — a dangling file is invisible waste", async () => {
    const { client, removed } = stubClient({ singles: [DRAFT_STATE] });

    await deleteLocationMedia(client, "m-1");

    expect(removed).toEqual([["admin-1/cover.jpg"]]);
  });

  it("keeps the row when storage removal fails, so the object stays recoverable", async () => {
    const { client, rowDeletes } = stubClient({
      singles: [DRAFT_STATE],
      removeError: { message: "network" },
    });

    await expect(deleteLocationMedia(client, "m-1")).rejects.toThrow(
      "Файл не удалён из хранилища: network",
    );
    expect(rowDeletes()).toBe(0);
  });

  it("keeps the row when the delivery copy cannot be revoked", async () => {
    const { client, rowDeletes, removed } = stubClient({
      singles: [PRIMARY_STATE],
      removeError: { message: "network" },
    });

    await expect(deleteLocationMedia(client, "m-1")).rejects.toThrow(
      "Публичная копия не отозвана: network",
    );
    // The original was never touched — deletion aborts before it can orphan anything.
    expect(removed).toEqual([["delivery/old.jpg"]]);
    expect(rowDeletes()).toBe(0);
  });

  it("is a no-op when the row is already gone", async () => {
    const { client, removed } = stubClient({ singles: [null] });

    await deleteLocationMedia(client, "m-1");

    expect(removed).toEqual([]);
  });
});
