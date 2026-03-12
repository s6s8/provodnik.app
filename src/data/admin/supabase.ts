import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  GuideApplication,
  GuideApplicationDecision,
  GuideApplicationDocument,
  VerificationState,
} from "@/features/admin/types/guide-review";
import type {
  DisputeCase,
  DisputeDecisionOutcome,
  DisputePolicyKey,
  DisputeQueueDisposition,
  DisputeSeverity,
  DisputeStage,
  PayoutFreezePosture,
} from "@/features/admin/types/disputes";
import type {
  ListingVisibility,
  ModerationAction,
  ModerationListing,
} from "@/features/admin/types/listing-moderation";
import type {
  GuideDocumentRow,
  GuideProfileRow,
  ListingRow,
  Uuid,
} from "@/lib/supabase/types";

export type GuideReviewStateRecord = {
  decision: GuideApplicationDecision;
  note: string;
  decidedAt?: string;
};

export type PersistedGuideApplication = GuideApplication & {
  reviewState: GuideReviewStateRecord;
};

export type ListingModerationStateRecord = {
  action: ModerationAction;
  note: string;
  visibility: ListingVisibility;
  decidedAt?: string;
};

export type PersistedModerationListing = ModerationListing & {
  moderationState: ListingModerationStateRecord;
};

type ModerationCaseRow = {
  id: string;
  subject_type: "guide_profile" | "listing" | "review";
  guide_id: string | null;
  listing_id: string | null;
  review_id: string | null;
  status: string;
  queue_reason: string;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
};

type ModerationActionRow = {
  id: string;
  case_id: string;
  decision: "approve" | "reject" | "request_changes" | "hide" | "restore";
  note: string | null;
  created_at: string;
};

type DisputeRow = {
  id: string;
  booking_id: string;
  opened_by: string;
  assigned_admin_id: string | null;
  status: "open" | "under_review" | "resolved" | "closed";
  reason: string;
  summary: string | null;
  requested_outcome: string | null;
  payout_frozen: boolean;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type DisputeNoteRow = {
  id: string;
  dispute_id: string;
  author_id: string;
  note: string;
  internal_only: boolean;
  created_at: string;
};

type BookingLiteRow = {
  id: string;
  traveler_id: string;
  guide_id: string;
  request_id: string | null;
  listing_id: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  subtotal_minor: number;
  currency: string;
};

function mapGuideDocumentState(
  status: GuideDocumentRow["status"],
): VerificationState {
  switch (status) {
    case "approved":
      return "verified";
    case "rejected":
      return "rejected";
    case "submitted":
      return "uploaded";
    case "draft":
    default:
      return "missing";
  }
}

function labelForDocumentType(documentType: string) {
  switch (documentType) {
    case "identity":
      return "Identity document";
    case "selfie":
      return "Selfie match";
    case "address":
      return "Proof of address";
    case "certification":
      return "Guide certification";
    default:
      return documentType;
  }
}

function mapGuideDecision(
  profile: GuideProfileRow,
  latestAction?: ModerationActionRow,
): GuideApplicationDecision {
  if (latestAction?.decision === "approve") return "approved";
  if (latestAction?.decision === "reject") return "rejected";
  if (latestAction?.decision === "request_changes") return "needs-more-info";
  if (profile.verification_status === "approved") return "approved";
  if (profile.verification_status === "rejected") return "rejected";
  return "pending";
}

function mapListingVisibility(listing: ListingRow, latestAction?: ModerationActionRow): ListingVisibility {
  if (latestAction?.decision === "request_changes") return "needs-changes";
  if (latestAction?.decision === "hide" || listing.status === "paused") return "hidden";
  if (latestAction?.decision === "reject" || listing.status === "rejected") return "blocked";
  if (listing.status === "published") return "published";
  return "draft";
}

function mapListingAction(
  latestAction?: ModerationActionRow,
): ModerationAction {
  if (!latestAction) return "pending";
  if (latestAction.decision === "approve" || latestAction.decision === "restore") {
    return "approve";
  }
  if (latestAction.decision === "hide") return "hide";
  if (latestAction.decision === "reject") return "block";
  return "request-changes";
}

function inferListingRiskReasons(listing: ListingRow, mediaCount: number): string[] {
  const reasons: string[] = [];
  if (listing.price_from_minor < 1_500_00) {
    reasons.push("Price is well below the typical floor for a guided experience.");
  }
  if ((listing.description ?? "").trim().length < 80) {
    reasons.push("Description is thin and may need more itinerary detail.");
  }
  if (mediaCount === 0) {
    reasons.push("Listing has no uploaded media metadata yet.");
  }
  if (listing.region.trim().length < 2) {
    reasons.push("Region metadata is incomplete.");
  }
  return reasons;
}

function inferDisputeSeverity(row: DisputeRow): DisputeSeverity {
  if (row.payout_frozen || row.status === "under_review") return "high";
  if (row.reason.toLowerCase().includes("safety")) return "critical";
  if (row.status === "resolved" || row.status === "closed") return "low";
  return "medium";
}

function inferDisputeStage(row: DisputeRow): DisputeStage {
  if (row.status === "resolved" || row.status === "closed") return "resolved";
  if (row.payout_frozen) return "investigating";
  return "intake";
}

function inferDisputeDisposition(row: DisputeRow): DisputeQueueDisposition {
  if (row.status === "resolved" || row.status === "closed") return "resolved";
  if (row.status === "under_review") return "needs-action";
  return "open";
}

function inferDisputePolicyKey(reason: string): DisputePolicyKey {
  const normalized = reason.toLowerCase();
  if (normalized.includes("cancel")) return "cancellation";
  if (normalized.includes("safety")) return "safety";
  if (normalized.includes("fraud")) return "fraud";
  if (normalized.includes("show")) return "service-not-delivered";
  return "quality-mismatch";
}

function outcomeLabel(outcome: DisputeDecisionOutcome | "unset") {
  switch (outcome) {
    case "refund-recommended":
      return "Refund recommended";
    case "partial-refund-recommended":
      return "Partial refund recommended";
    case "goodwill-credit-recommended":
      return "Goodwill credit recommended";
    case "refund-denied":
      return "Refund denied";
    case "no-action":
      return "No action";
    default:
      return "Pending";
  }
}

async function currentAdminUserId(): Promise<Uuid> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Admin must be authenticated.");
  return user.id as Uuid;
}

async function ensureModerationCase(input: {
  subjectType: ModerationCaseRow["subject_type"];
  guideId?: string | null;
  listingId?: string | null;
  reviewId?: string | null;
  queueReason: string;
  riskFlags?: string[];
}): Promise<ModerationCaseRow> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("moderation_cases")
    .select("id, subject_type, guide_id, listing_id, review_id, status, queue_reason, risk_flags, created_at, updated_at")
    .eq("subject_type", input.subjectType);

  if (input.subjectType === "guide_profile") {
    query = query.eq("guide_id", input.guideId ?? "");
  } else if (input.subjectType === "listing") {
    query = query.eq("listing_id", input.listingId ?? "");
  } else {
    query = query.eq("review_id", input.reviewId ?? "");
  }

  const { data: existing, error: existingError } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") throw existingError;
  if (existing) return existing as ModerationCaseRow;

  const adminId = await currentAdminUserId();
  const { data, error } = await supabase
    .from("moderation_cases")
    .insert({
      subject_type: input.subjectType,
      guide_id: input.guideId ?? null,
      listing_id: input.listingId ?? null,
      review_id: input.reviewId ?? null,
      opened_by: adminId,
      assigned_admin_id: adminId,
      status: "open",
      queue_reason: input.queueReason,
      risk_flags: input.riskFlags ?? [],
    })
    .select("id, subject_type, guide_id, listing_id, review_id, status, queue_reason, risk_flags, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as ModerationCaseRow;
}

export async function listGuideApplicationsForAdminFromSupabase(): Promise<
  PersistedGuideApplication[]
> {
  const supabase = createSupabaseBrowserClient();
  const [{ data: profiles, error: profilesError }, { data: profileRows, error: accountError }, { data: documents, error: documentsError }, { data: cases, error: casesError }, { data: actions, error: actionsError }] =
    await Promise.all([
      supabase
        .from("guide_profiles")
        .select("user_id, slug, display_name, bio, years_experience, regions, languages, specialties, attestation_status, verification_status, verification_notes, payout_account_label, created_at, updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, phone"),
      supabase
        .from("guide_documents")
        .select("id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("moderation_cases")
        .select("id, subject_type, guide_id, listing_id, review_id, status, queue_reason, risk_flags, created_at, updated_at")
        .eq("subject_type", "guide_profile"),
      supabase
        .from("moderation_actions")
        .select("id, case_id, decision, note, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (profilesError) throw profilesError;
  if (accountError) throw accountError;
  if (documentsError) throw documentsError;
  if (casesError) throw casesError;
  if (actionsError) throw actionsError;

  const accountsById = new Map(
    (profileRows ?? []).map((row) => [row.id as string, row as { full_name?: string | null; email?: string | null; phone?: string | null }]),
  );
  const documentsByGuide = new Map<string, GuideDocumentRow[]>();
  for (const row of (documents ?? []) as GuideDocumentRow[]) {
    const current = documentsByGuide.get(row.guide_id) ?? [];
    current.push(row);
    documentsByGuide.set(row.guide_id, current);
  }

  const casesByGuide = new Map<string, ModerationCaseRow>();
  for (const row of (cases ?? []) as ModerationCaseRow[]) {
    if (row.guide_id && !casesByGuide.has(row.guide_id)) {
      casesByGuide.set(row.guide_id, row);
    }
  }

  const latestActionByCase = new Map<string, ModerationActionRow>();
  for (const row of (actions ?? []) as ModerationActionRow[]) {
    if (!latestActionByCase.has(row.case_id)) {
      latestActionByCase.set(row.case_id, row);
    }
  }

  return ((profiles ?? []) as GuideProfileRow[]).map((profile) => {
    const account = accountsById.get(profile.user_id) ?? {};
    const docs = documentsByGuide.get(profile.user_id) ?? [];
    const moderationCase = casesByGuide.get(profile.user_id);
    const latestAction = moderationCase
      ? latestActionByCase.get(moderationCase.id)
      : undefined;
    const decision = mapGuideDecision(profile, latestAction);

    const structuredDocs: GuideApplicationDocument[] = docs.length
      ? docs.map((doc) => ({
          key: (doc.document_type as GuideApplicationDocument["key"]) ?? "identity",
          label: labelForDocumentType(doc.document_type),
          state: mapGuideDocumentState(doc.status),
        }))
      : [
          { key: "identity", label: "Identity document", state: "missing" },
          { key: "selfie", label: "Selfie match", state: "missing" },
          { key: "address", label: "Proof of address", state: "missing" },
          { key: "certification", label: "Guide certification", state: "missing" },
        ];

    const missingDocs = structuredDocs.filter((doc) => doc.state === "missing");
    const flags = [
      ...(missingDocs.length > 0 ? [`Missing ${missingDocs.length} verification document(s)`] : []),
      ...(profile.verification_status === "rejected" ? ["Verification previously rejected"] : []),
    ];

    return {
      id: profile.user_id,
      submittedAt: profile.updated_at,
      applicant: {
        displayName:
          profile.display_name ||
          (account.full_name as string | null) ||
          (account.email as string | null) ||
          "Guide",
        homeBase: profile.regions[0] ?? "Unknown",
        languages: profile.languages,
        yearsExperience: profile.years_experience ?? 0,
      },
      trustSignals: {
        emailVerified: Boolean(account.email),
        phoneVerified: Boolean(account.phone),
        identityVerified: structuredDocs.some(
          (doc) => doc.key === "identity" && doc.state === "verified",
        ),
        backgroundCheck: profile.verification_notes?.includes("Background check consent: yes") ?? false,
        references: profile.verification_notes?.includes("References:") ?? false,
      },
      documents: structuredDocs,
      flags,
      summary: profile.bio || "No guide bio yet.",
      reviewState: {
        decision,
        note: latestAction?.note ?? "",
        decidedAt: latestAction?.created_at,
      },
    };
  });
}

export async function saveGuideReviewDecisionInSupabase(input: {
  guideId: string;
  decision: GuideApplicationDecision;
  note: string;
}): Promise<GuideReviewStateRecord> {
  const supabase = createSupabaseBrowserClient();
  const moderationCase = await ensureModerationCase({
    subjectType: "guide_profile",
    guideId: input.guideId,
    queueReason: "Guide verification review",
  });
  const adminId = await currentAdminUserId();

  const mappedDecision =
    input.decision === "approved"
      ? "approve"
      : input.decision === "rejected"
        ? "reject"
        : "request_changes";

  const { error: actionError } = await supabase.from("moderation_actions").insert({
    case_id: moderationCase.id,
    admin_id: adminId,
    decision: mappedDecision,
    note: input.note || null,
  });

  if (actionError) throw actionError;

  const { error: caseError } = await supabase
    .from("moderation_cases")
    .update({
      status: input.decision === "pending" ? "open" : input.decision,
      assigned_admin_id: adminId,
    })
    .eq("id", moderationCase.id);

  if (caseError) throw caseError;

  const verificationStatus =
    input.decision === "approved"
      ? "approved"
      : input.decision === "rejected"
        ? "rejected"
        : "submitted";

  const { error: profileError } = await supabase
    .from("guide_profiles")
    .update({ verification_status: verificationStatus })
    .eq("user_id", input.guideId);

  if (profileError) throw profileError;

  return {
    decision: input.decision,
    note: input.note,
    decidedAt: new Date().toISOString(),
  };
}

export async function listModerationListingsForAdminFromSupabase(): Promise<
  PersistedModerationListing[]
> {
  const supabase = createSupabaseBrowserClient();
  const [{ data: listings, error: listingsError }, { data: guideProfiles, error: guidesError }, { data: media, error: mediaError }, { data: cases, error: casesError }, { data: actions, error: actionsError }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id, guide_id, slug, title, region, city, category, route_summary, description, duration_minutes, max_group_size, price_from_minor, currency, private_available, group_available, instant_book, meeting_point, inclusions, exclusions, cancellation_policy_key, status, featured_rank, created_at, updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("guide_profiles").select("user_id, display_name, languages"),
      supabase.from("listing_media").select("listing_id"),
      supabase
        .from("moderation_cases")
        .select("id, subject_type, guide_id, listing_id, review_id, status, queue_reason, risk_flags, created_at, updated_at")
        .eq("subject_type", "listing"),
      supabase
        .from("moderation_actions")
        .select("id, case_id, decision, note, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (listingsError) throw listingsError;
  if (guidesError) throw guidesError;
  if (mediaError) throw mediaError;
  if (casesError) throw casesError;
  if (actionsError) throw actionsError;

  const guidesById = new Map(
    (guideProfiles ?? []).map((row) => [
      row.user_id as string,
      row as { display_name?: string | null; languages?: string[] | null },
    ]),
  );
  const mediaCountByListing = new Map<string, number>();
  for (const row of media ?? []) {
    const listingId = (row as { listing_id: string }).listing_id;
    mediaCountByListing.set(listingId, (mediaCountByListing.get(listingId) ?? 0) + 1);
  }
  const casesByListing = new Map<string, ModerationCaseRow>();
  for (const row of (cases ?? []) as ModerationCaseRow[]) {
    if (row.listing_id && !casesByListing.has(row.listing_id)) {
      casesByListing.set(row.listing_id, row);
    }
  }
  const latestActionByCase = new Map<string, ModerationActionRow>();
  for (const row of (actions ?? []) as ModerationActionRow[]) {
    if (!latestActionByCase.has(row.case_id)) {
      latestActionByCase.set(row.case_id, row);
    }
  }

  return ((listings ?? []) as ListingRow[]).map((listing) => {
    const guide = guidesById.get(listing.guide_id) ?? {};
    const moderationCase = casesByListing.get(listing.id);
    const latestAction = moderationCase
      ? latestActionByCase.get(moderationCase.id)
      : undefined;
    const visibility = mapListingVisibility(listing, latestAction);
    const action = mapListingAction(latestAction);
    const mediaCount = mediaCountByListing.get(listing.id) ?? 0;
    const riskReasons = inferListingRiskReasons(listing, mediaCount);

    return {
      id: listing.id,
      submittedAt: listing.updated_at,
      listing: {
        title: listing.title,
        category: listing.category,
        location: [listing.city, listing.region].filter(Boolean).join(", "),
        language: guide.languages ?? [],
        price: {
          amount: Math.round(listing.price_from_minor / 100),
          currency: listing.currency as "USD" | "EUR" | "GEL",
        },
        sellerDisplayName: (guide.display_name as string | null) ?? "Guide",
      },
      visibility,
      riskSignals: {
        newSeller: listing.featured_rank == null,
        priceOutlier: listing.price_from_minor < 1_500_00,
        duplicateContent: false,
        keywordSpam: /!{2,}|[A-Z]{6,}/.test(listing.title),
        geoMismatch: !listing.city,
        riskyMedia: mediaCount === 0,
      },
      riskReasons,
      policyNotes: riskReasons.map((reason) => ({
        key: "needs-review" as const,
        title: "Moderation check",
        detail: reason,
      })),
      excerpt: listing.description ?? listing.route_summary ?? "No public description yet.",
      moderationState: {
        action,
        note: latestAction?.note ?? "",
        visibility,
        decidedAt: latestAction?.created_at,
      },
    };
  });
}

export async function saveListingModerationActionInSupabase(input: {
  listingId: string;
  action: ModerationAction;
  note: string;
}): Promise<ListingModerationStateRecord> {
  const supabase = createSupabaseBrowserClient();
  const moderationCase = await ensureModerationCase({
    subjectType: "listing",
    listingId: input.listingId,
    queueReason: "Listing moderation review",
  });
  const adminId = await currentAdminUserId();

  const mappedDecision =
    input.action === "approve"
      ? "approve"
      : input.action === "hide"
        ? "hide"
        : input.action === "block"
          ? "reject"
          : "request_changes";

  const { error: actionError } = await supabase.from("moderation_actions").insert({
    case_id: moderationCase.id,
    admin_id: adminId,
    decision: mappedDecision,
    note: input.note || null,
  });

  if (actionError) throw actionError;

  const nextStatus =
    input.action === "approve"
      ? "published"
      : input.action === "hide"
        ? "paused"
        : input.action === "block"
          ? "rejected"
          : "draft";

  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: nextStatus })
    .eq("id", input.listingId);

  if (listingError) throw listingError;

  const visibility =
    input.action === "approve"
      ? "published"
      : input.action === "hide"
        ? "hidden"
        : input.action === "block"
          ? "blocked"
          : "needs-changes";

  return {
    action: input.action,
    note: input.note,
    visibility,
    decidedAt: new Date().toISOString(),
  };
}

export async function listDisputeCasesForAdminFromSupabase(): Promise<DisputeCase[]> {
  const supabase = createSupabaseBrowserClient();
  const [{ data: disputes, error: disputesError }, { data: bookings, error: bookingsError }, { data: profiles, error: profilesError }, { data: listings, error: listingsError }, { data: requests, error: requestsError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabase
        .from("disputes")
        .select("id, booking_id, opened_by, assigned_admin_id, status, reason, summary, requested_outcome, payout_frozen, resolution_summary, created_at, updated_at, resolved_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id, traveler_id, guide_id, request_id, listing_id, status, starts_at, ends_at, subtotal_minor, currency"),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("listings").select("id, title, region, city"),
      supabase.from("traveler_requests").select("id, destination"),
      supabase.from("dispute_notes").select("id, dispute_id, author_id, note, internal_only, created_at"),
    ]);

  if (disputesError) throw disputesError;
  if (bookingsError) throw bookingsError;
  if (profilesError) throw profilesError;
  if (listingsError) throw listingsError;
  if (requestsError) throw requestsError;
  if (notesError) throw notesError;

  const bookingsById = new Map((bookings ?? []).map((row) => [row.id as string, row as BookingLiteRow]));
  const profilesById = new Map(
    (profiles ?? []).map((row) => [
      row.id as string,
      ((row as { full_name?: string | null }).full_name ||
        (row as { email?: string | null }).email ||
        "User") as string,
    ]),
  );
  const listingsById = new Map(
    (listings ?? []).map((row) => [row.id as string, row as { title?: string | null; region?: string | null; city?: string | null }]),
  );
  const requestsById = new Map(
    (requests ?? []).map((row) => [row.id as string, (row as { destination?: string | null }).destination ?? "Request"]),
  );
  const notesByDispute = new Map<string, DisputeNoteRow[]>();
  for (const row of (notes ?? []) as DisputeNoteRow[]) {
    const current = notesByDispute.get(row.dispute_id) ?? [];
    current.push(row);
    notesByDispute.set(row.dispute_id, current);
  }

  return ((disputes ?? []) as DisputeRow[]).flatMap((row) => {
    const booking = bookingsById.get(row.booking_id);
    if (!booking) return [];

    const listing = booking.listing_id ? listingsById.get(booking.listing_id) : null;
    const routeLabel =
      listing?.title ||
      (booking.request_id ? requestsById.get(booking.request_id) : null) ||
      "Custom booking";
    const disputeNotes = notesByDispute.get(row.id) ?? [];
    const timeline = [
      {
        at: row.created_at,
        actor: "traveler" as const,
        type: "opened" as const,
        summary: row.reason,
        detail: row.summary ?? undefined,
      },
      ...disputeNotes.map((note) => ({
        at: note.created_at,
        actor: "admin" as const,
        type: note.internal_only ? ("internal-note" as const) : ("message" as const),
        summary: note.note,
        detail: undefined,
      })),
      ...(row.resolution_summary
        ? [{
            at: row.resolved_at ?? row.updated_at,
            actor: "admin" as const,
            type: "decision" as const,
            summary: row.resolution_summary,
            detail: undefined,
          }]
        : []),
    ].sort((a, b) => a.at.localeCompare(b.at));

    return [{
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      severity: inferDisputeSeverity(row),
      stage: inferDisputeStage(row),
      disposition: inferDisputeDisposition(row),
      policyKey: inferDisputePolicyKey(row.reason),
      booking: {
        id: booking.id,
        status:
          booking.status === "confirmed"
            ? "confirmed"
            : booking.status === "completed"
              ? "completed"
              : booking.status === "cancelled"
                ? "cancelled"
                : "requested",
        serviceDate: booking.starts_at ?? row.created_at,
        routeLabel,
        amount: {
          amount: Math.round(booking.subtotal_minor / 100),
          currency: (booking.currency as "USD" | "EUR" | "GEL") || "USD",
        },
      },
      parties: {
        travelerDisplayName: profilesById.get(booking.traveler_id) ?? "Traveler",
        guideDisplayName: profilesById.get(booking.guide_id) ?? "Guide",
      },
      payout: {
        posture: row.payout_frozen ? "hard-freeze" : "not-frozen",
        reason: row.payout_frozen
          ? "Payout is frozen while the dispute is under review."
          : "No payout freeze recorded.",
        frozenAt: row.payout_frozen ? row.updated_at : undefined,
      },
      summary: row.summary ?? row.reason,
      policyContext: [
        {
          key: "context",
          title: "Requested outcome",
          detail: row.requested_outcome ?? "No requested outcome provided.",
        },
      ],
      timeline,
      nextActions: [
        {
          key: "review-evidence",
          title: "Review available evidence",
          owner: "admin",
        },
        {
          key: "set-resolution",
          title: "Set dispute resolution note",
          owner: "admin",
        },
      ],
      recommendedOutcome: row.resolution_summary ? "no-action" : undefined,
    } satisfies DisputeCase];
  });
}

export async function saveDisputeAdminUpdateInSupabase(input: {
  disputeId: string;
  posture: PayoutFreezePosture;
  internalNotes: string;
  stageNote: string;
  operatorOutcome: DisputeDecisionOutcome | "unset";
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const adminId = await currentAdminUserId();
  const nextStatus =
    input.operatorOutcome === "unset" ? "under_review" : "resolved";

  const resolutionSummary = [input.stageNote.trim(), outcomeLabel(input.operatorOutcome)]
    .filter(Boolean)
    .join(" - ");

  const { error: disputeError } = await supabase
    .from("disputes")
    .update({
      payout_frozen: input.posture !== "not-frozen",
      status: nextStatus,
      resolution_summary: resolutionSummary || null,
      resolved_at: input.operatorOutcome === "unset" ? null : new Date().toISOString(),
      assigned_admin_id: adminId,
    })
    .eq("id", input.disputeId);

  if (disputeError) throw disputeError;

  const notesToInsert = [input.internalNotes.trim(), input.stageNote.trim()].filter(Boolean);
  for (const note of notesToInsert) {
    const { error: noteError } = await supabase.from("dispute_notes").insert({
      dispute_id: input.disputeId,
      author_id: adminId,
      note,
      internal_only: true,
    });

    if (noteError) throw noteError;
  }
}
