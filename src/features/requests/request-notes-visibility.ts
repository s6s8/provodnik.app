export type RequestNotesViewer = {
  viewerRole: "owner" | "guide" | "admin" | "public";
  /** Only meaningful for `viewerRole: "guide"`. */
  isApprovedGuide?: boolean;
};

/**
 * The traveler's free-text «Пожелания» (request notes) can carry sensitive
 * personal or medical details — the field's own placeholder invites «ограничения
 * по здоровью» (health restrictions). It is therefore private, not public
 * discovery data.
 *
 * Readable only by the owner, an admin, or an APPROVED guide who can legitimately
 * act on the request. Anonymous visitors, logged-in non-participants, prospective
 * joiners, joined members and unverified guides must not see it — public discovery
 * stays limited to destination, dates, budget, group size and themes.
 */
export function canSeeRequestNotes(viewer: RequestNotesViewer): boolean {
  if (viewer.viewerRole === "owner" || viewer.viewerRole === "admin") return true;
  if (viewer.viewerRole === "guide") return viewer.isApprovedGuide === true;
  return false;
}
