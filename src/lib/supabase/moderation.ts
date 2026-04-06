import "server-only";

import { z } from "zod";

import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GuideDocumentRow,
  GuideProfileRow,
  ListingRow,
  NotificationKindDb,
  StorageAssetRow,
  Uuid,
} from "@/lib/supabase/types";

type ProfileLite = {
  id: Uuid;
  full_name: string | null;
  email: string | null;
};

export type ModerationSubjectType = "guide_profile" | "listing" | "review";
export type ModerationDecision =
  | "approve"
  | "reject"
  | "request_changes"
  | "hide"
  | "restore";

export type ModerationCaseRow = {
  id: Uuid;
  subject_type: ModerationSubjectType;
  guide_id: Uuid | null;
  listing_id: Uuid | null;
  review_id: Uuid | null;
  opened_by: Uuid | null;
  assigned_admin_id: Uuid | null;
  status: string;
  queue_reason: string;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
};

export type ModerationActionRow = {
  id: Uuid;
  case_id: Uuid;
  admin_id: Uuid | null;
  decision: ModerationDecision;
  note: string | null;
  created_at: string;
};

export type ModerationCaseListItem = ModerationCaseRow & {
  guide_name: string | null;
  listing_title: string | null;
};

export type GuideDocumentWithAsset = GuideDocumentRow & {
  storage_asset: StorageAssetRow | null;
  signed_url: string | null;
};

export type GuideReviewQueueItem = {
  profile: GuideProfileRow;
  account: ProfileLite | null;
  latest_case: ModerationCaseRow | null;
  latest_action: ModerationActionRow | null;
};

export type GuideReviewDetail = {
  profile: GuideProfileRow;
  account: ProfileLite | null;
  documents: GuideDocumentWithAsset[];
  moderation_case: ModerationCaseDetail | null;
};

export type ListingModerationRow = {
  listing: ListingRow;
  guide_profile: GuideProfileRow | null;
  guide_account: ProfileLite | null;
  moderation_case: ModerationCaseRow | null;
  latest_action: ModerationActionRow | null;
};

export type ModerationCaseDetail = ModerationCaseRow & {
  actions: ModerationActionRow[];
  guide_profile: GuideProfileRow | null;
  guide_account: ProfileLite | null;
  listing: ListingRow | null;
  review: ReviewWithRelations | null;
};

export type ReviewWithRelations = ReviewRow & {
  traveler: ProfileLite | null;
  guide_profile: GuideProfileRow | null;
  guide_account: ProfileLite | null;
  listing: ListingRow | null;
};

export type AdminDashboardStats = {
  pendingGuideApplications: number;
  pendingListingReviews: number;
  openDisputes: number;
  totalBookings: number;
};

type ReviewRow = {
  id: Uuid;
  booking_id: Uuid;
  traveler_id: Uuid;
  guide_id: Uuid | null;
  listing_id: Uuid | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "published" | "flagged" | "hidden";
  created_at: string;
  updated_at: string;
};

const moderationFiltersSchema = z.object({
  status: z.string().trim().min(1).optional(),
  subjectType: z.enum(["guide_profile", "listing", "review"]).optional(),
});

const createModerationCaseSchema = z
  .object({
    subjectType: z.enum(["guide_profile", "listing", "review"]),
    guideId: z.string().uuid().optional(),
    listingId: z.string().uuid().optional(),
    reviewId: z.string().uuid().optional(),
    queueReason: z.string().trim().min(1).max(400),
    riskFlags: z.array(z.string().trim().min(1).max(160)).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.subjectType === "guide_profile" && !value.guideId) {
      ctx.addIssue({
        code: "custom",
        path: ["guideId"],
        message: "Для кейса гида нужен guideId.",
      });
    }

    if (value.subjectType === "listing" && !value.listingId) {
      ctx.addIssue({
        code: "custom",
        path: ["listingId"],
        message: "Для кейса листинга нужен listingId.",
      });
    }

    if (value.subjectType === "review" && !value.reviewId) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewId"],
        message: "Для кейса отзыва нужен reviewId.",
      });
    }
  });

const performModerationActionSchema = z.object({
  caseId: z.string().uuid(),
  adminId: z.string().uuid(),
  decision: z.enum(["approve", "reject", "request_changes", "hide", "restore"]),
  note: z.string().trim().max(2_000).optional(),
});

async function requireAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Требуется вход администратора.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.role !== "admin") {
    throw new Error("Доступ только для администраторов.");
  }

  return {
    adminId: user.id as Uuid,
    adminProfile: {
      id: profile.id as Uuid,
      full_name: profile.full_name ?? null,
      email: profile.email ?? null,
    } satisfies ProfileLite,
    adminClient: createSupabaseAdminClient(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatGuideName(
  profile: ProfileLite | null | undefined,
  guideProfile: GuideProfileRow | null | undefined,
) {
  return (
    guideProfile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    profile?.email?.trim() ||
    null
  );
}

async function getProfilesByIds(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  ids: Uuid[],
) {
  if (!ids.length) {
    return new Map<Uuid, ProfileLite>();
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  if (error) throw error;

  return new Map(
    ((data ?? []) as ProfileLite[]).map((profile) => [profile.id, profile]),
  );
}

async function getGuideProfilesByIds(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  ids: Uuid[],
) {
  if (!ids.length) {
    return new Map<Uuid, GuideProfileRow>();
  }

  const { data, error } = await adminClient
    .from("guide_profiles")
    .select("*")
    .in("user_id", ids);

  if (error) throw error;

  return new Map(
    ((data ?? []) as GuideProfileRow[]).map((profile) => [profile.user_id, profile]),
  );
}

async function getListingsByIds(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  ids: Uuid[],
) {
  if (!ids.length) {
    return new Map<Uuid, ListingRow>();
  }

  const { data, error } = await adminClient.from("listings").select("*").in("id", ids);

  if (error) throw error;

  return new Map(((data ?? []) as ListingRow[]).map((listing) => [listing.id, listing]));
}

async function getLatestActionMap(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  caseIds: Uuid[],
) {
  if (!caseIds.length) {
    return new Map<Uuid, ModerationActionRow>();
  }

  const { data, error } = await adminClient
    .from("moderation_actions")
    .select("id, case_id, admin_id, decision, note, created_at")
    .in("case_id", caseIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const latestByCase = new Map<Uuid, ModerationActionRow>();
  for (const action of (data ?? []) as ModerationActionRow[]) {
    if (!latestByCase.has(action.case_id)) {
      latestByCase.set(action.case_id, action);
    }
  }

  return latestByCase;
}

async function getReviewById(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  reviewId: Uuid,
): Promise<ReviewWithRelations | null> {
  const { data: review, error: reviewError } = await adminClient
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError) throw reviewError;
  if (!review) return null;

  const typedReview = review as ReviewRow;
  const [travelerProfiles, guideProfiles, guideAccounts, listings] = await Promise.all([
    getProfilesByIds(adminClient, [typedReview.traveler_id]),
    typedReview.guide_id ? getGuideProfilesByIds(adminClient, [typedReview.guide_id]) : new Map(),
    typedReview.guide_id ? getProfilesByIds(adminClient, [typedReview.guide_id]) : new Map(),
    typedReview.listing_id ? getListingsByIds(adminClient, [typedReview.listing_id]) : new Map(),
  ]);

  return {
    ...typedReview,
    traveler: travelerProfiles.get(typedReview.traveler_id) ?? null,
    guide_profile: typedReview.guide_id
      ? guideProfiles.get(typedReview.guide_id) ?? null
      : null,
    guide_account: typedReview.guide_id
      ? guideAccounts.get(typedReview.guide_id) ?? null
      : null,
    listing: typedReview.listing_id
      ? listings.get(typedReview.listing_id) ?? null
      : null,
  };
}

async function getNotificationRecipient(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  moderationCase: ModerationCaseRow,
): Promise<{ userId: Uuid | null; href: string | null; title: string; body: string } | null> {
  if (moderationCase.subject_type === "guide_profile" && moderationCase.guide_id) {
    const [guideProfiles, profiles] = await Promise.all([
      getGuideProfilesByIds(adminClient, [moderationCase.guide_id]),
      getProfilesByIds(adminClient, [moderationCase.guide_id]),
    ]);
    const guideProfile = guideProfiles.get(moderationCase.guide_id) ?? null;
    const account = profiles.get(moderationCase.guide_id) ?? null;
    const name = formatGuideName(account, guideProfile) ?? "вашей анкеты";

    return {
      userId: moderationCase.guide_id,
      href: "/guide/verification",
      title: "Обновление по проверке гида",
      body: `Администратор обновил статус проверки анкеты ${name}.`,
    };
  }

  if (moderationCase.subject_type === "listing" && moderationCase.listing_id) {
    const listings = await getListingsByIds(adminClient, [moderationCase.listing_id]);
    const listing = listings.get(moderationCase.listing_id) ?? null;
    if (!listing) return null;

    return {
      userId: listing.guide_id,
      href: `/guide/listings/${listing.id}`,
      title: "Обновление по проверке листинга",
      body: `Проверка листинга «${listing.title}» была обновлена администратором.`,
    };
  }

  if (moderationCase.subject_type === "review" && moderationCase.review_id) {
    const review = await getReviewById(adminClient, moderationCase.review_id);
    if (!review) return null;

    return {
      userId: review.traveler_id,
      href: review.listing_id ? `/listings/${review.listing_id}` : null,
      title: "Обновление по отзыву",
      body: "Администратор обновил статус вашего отзыва.",
    };
  }

  return null;
}

export async function getModerationCases(filters?: {
  status?: string;
  subjectType?: string;
}): Promise<ModerationCaseListItem[]> {
  const input = moderationFiltersSchema.parse(filters ?? {});
  const { adminClient } = await requireAdminSession();

  let query = adminClient
    .from("moderation_cases")
    .select(
      "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.subjectType) {
    query = query.eq("subject_type", input.subjectType);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cases = (data ?? []) as ModerationCaseRow[];
  const guideIds = [...new Set(cases.map((item) => item.guide_id).filter(Boolean) as Uuid[])];
  const listingIds = [...new Set(cases.map((item) => item.listing_id).filter(Boolean) as Uuid[])];

  const [profiles, guideProfiles, listings] = await Promise.all([
    getProfilesByIds(adminClient, guideIds),
    getGuideProfilesByIds(adminClient, guideIds),
    getListingsByIds(adminClient, listingIds),
  ]);

  return cases.map((item) => ({
    ...item,
    guide_name: item.guide_id
      ? formatGuideName(profiles.get(item.guide_id), guideProfiles.get(item.guide_id))
      : null,
    listing_title: item.listing_id ? listings.get(item.listing_id)?.title ?? null : null,
  }));
}

export async function getModerationCase(caseId: string): Promise<ModerationCaseDetail | null> {
  const { adminClient } = await requireAdminSession();

  const { data: moderationCase, error } = await adminClient
    .from("moderation_cases")
    .select(
      "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
    )
    .eq("id", caseId)
    .maybeSingle();

  if (error) throw error;
  if (!moderationCase) return null;

  const typedCase = moderationCase as ModerationCaseRow;
  const [actionsResult, guideProfiles, guideAccounts, listings, review] = await Promise.all([
    adminClient
      .from("moderation_actions")
      .select("id, case_id, admin_id, decision, note, created_at")
      .eq("case_id", typedCase.id)
      .order("created_at", { ascending: false }),
    typedCase.guide_id ? getGuideProfilesByIds(adminClient, [typedCase.guide_id]) : new Map(),
    typedCase.guide_id ? getProfilesByIds(adminClient, [typedCase.guide_id]) : new Map(),
    typedCase.listing_id ? getListingsByIds(adminClient, [typedCase.listing_id]) : new Map(),
    typedCase.review_id ? getReviewById(adminClient, typedCase.review_id) : null,
  ]);

  if ("error" in actionsResult && actionsResult.error) {
    throw actionsResult.error;
  }

  return {
    ...typedCase,
    actions: ((actionsResult.data ?? []) as ModerationActionRow[]) ?? [],
    guide_profile: typedCase.guide_id
      ? guideProfiles.get(typedCase.guide_id) ?? null
      : null,
    guide_account: typedCase.guide_id
      ? guideAccounts.get(typedCase.guide_id) ?? null
      : null,
    listing: typedCase.listing_id ? listings.get(typedCase.listing_id) ?? null : null,
    review,
  };
}

export async function createModerationCase(data: {
  subjectType: ModerationSubjectType;
  guideId?: string;
  listingId?: string;
  reviewId?: string;
  queueReason: string;
  riskFlags?: string[];
}): Promise<ModerationCaseRow> {
  const input = createModerationCaseSchema.parse(data);
  const { adminId, adminClient } = await requireAdminSession();

  const { data: row, error } = await adminClient
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
    .select(
      "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return row as ModerationCaseRow;
}

export async function ensureOpenModerationCase(input: {
  subjectType: ModerationSubjectType;
  guideId?: string;
  listingId?: string;
  reviewId?: string;
  queueReason: string;
  riskFlags?: string[];
}) {
  const { adminClient } = await requireAdminSession();

  let query = adminClient
    .from("moderation_cases")
    .select(
      "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
    )
    .eq("subject_type", input.subjectType)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);

  if (input.subjectType === "guide_profile" && input.guideId) {
    query = query.eq("guide_id", input.guideId);
  }

  if (input.subjectType === "listing" && input.listingId) {
    query = query.eq("listing_id", input.listingId);
  }

  if (input.subjectType === "review" && input.reviewId) {
    query = query.eq("review_id", input.reviewId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;

  if (data) {
    return data as ModerationCaseRow;
  }

  return createModerationCase(input);
}

export async function performModerationAction(
  caseId: string,
  adminId: string,
  decision: ModerationDecision,
  note?: string,
): Promise<ModerationActionRow> {
  const input = performModerationActionSchema.parse({ caseId, adminId, decision, note });
  const { adminId: currentAdminId, adminClient } = await requireAdminSession();

  if (currentAdminId !== input.adminId) {
    throw new Error("Администратор сессии не совпадает с adminId действия.");
  }

  const moderationCase = await getModerationCase(input.caseId);
  if (!moderationCase) {
    throw new Error("Кейс модерации не найден.");
  }

  const { data: action, error: actionError } = await adminClient
    .from("moderation_actions")
    .insert({
      case_id: moderationCase.id,
      admin_id: input.adminId,
      decision: input.decision,
      note: input.note?.trim() || null,
    })
    .select("id, case_id, admin_id, decision, note, created_at")
    .single();

  if (actionError) throw actionError;

  const nextStatus = input.decision === "request_changes" ? "open" : "resolved";

  const { error: caseError } = await adminClient
    .from("moderation_cases")
    .update({
      status: nextStatus,
      assigned_admin_id: input.adminId,
    })
    .eq("id", moderationCase.id);

  if (caseError) throw caseError;

  if (moderationCase.subject_type === "guide_profile" && moderationCase.guide_id) {
    if (input.decision === "approve" || input.decision === "reject") {
      const { error } = await adminClient
        .from("guide_profiles")
        .update({
          verification_status: input.decision === "approve" ? "approved" : "rejected",
        })
        .eq("user_id", moderationCase.guide_id);

      if (error) throw error;
    }
  }

  if (moderationCase.subject_type === "listing" && moderationCase.listing_id) {
    if (input.decision === "approve" || input.decision === "reject") {
      const { error } = await adminClient
        .from("listings")
        .update({
          status: input.decision === "approve" ? "published" : "rejected",
        })
        .eq("id", moderationCase.listing_id);

      if (error) throw error;
    }
  }

  if (moderationCase.subject_type === "review" && moderationCase.review_id) {
    if (input.decision === "hide" || input.decision === "restore") {
      const { error } = await adminClient
        .from("reviews")
        .update({
          status: input.decision === "hide" ? "hidden" : "published",
        })
        .eq("id", moderationCase.review_id);

      if (error) throw error;
    }
  }

  const recipient = await getNotificationRecipient(adminClient, moderationCase);
  if (recipient?.userId) {
    await createNotification({
      userId: recipient.userId,
      kind: "admin_alert" satisfies NotificationKindDb,
      title: recipient.title,
      body: recipient.body,
      href: recipient.href ?? undefined,
    });
  }

  return action as ModerationActionRow;
}

export async function getGuideReviewQueue(): Promise<GuideReviewQueueItem[]> {
  const { adminClient } = await requireAdminSession();

  const { data: profiles, error } = await adminClient
    .from("guide_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const guideProfiles = (profiles ?? []) as GuideProfileRow[];
  const guideIds = guideProfiles.map((profile) => profile.user_id);
  const [accounts, casesResult] = await Promise.all([
    getProfilesByIds(adminClient, guideIds),
    adminClient
      .from("moderation_cases")
      .select(
        "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
      )
      .eq("subject_type", "guide_profile")
      .in("guide_id", guideIds)
      .order("created_at", { ascending: false }),
  ]);

  if (casesResult.error) throw casesResult.error;

  const latestCaseByGuide = new Map<Uuid, ModerationCaseRow>();
  for (const moderationCase of (casesResult.data ?? []) as ModerationCaseRow[]) {
    if (moderationCase.guide_id && !latestCaseByGuide.has(moderationCase.guide_id)) {
      latestCaseByGuide.set(moderationCase.guide_id, moderationCase);
    }
  }

  const latestActions = await getLatestActionMap(
    adminClient,
    [...latestCaseByGuide.values()].map((item) => item.id),
  );

  return guideProfiles
    .map((profile) => {
      const latestCase = latestCaseByGuide.get(profile.user_id) ?? null;
      return {
        profile,
        account: accounts.get(profile.user_id) ?? null,
        latest_case: latestCase,
        latest_action: latestCase ? latestActions.get(latestCase.id) ?? null : null,
      };
    })
    .sort((left, right) => {
      const leftPending = left.profile.verification_status === "submitted" ? 0 : 1;
      const rightPending = right.profile.verification_status === "submitted" ? 0 : 1;
      if (leftPending !== rightPending) return leftPending - rightPending;
      return right.profile.updated_at.localeCompare(left.profile.updated_at);
    });
}

export async function getGuideReviewDetail(guideId: string): Promise<GuideReviewDetail | null> {
  const { adminClient } = await requireAdminSession();

  const { data: profile, error: profileError } = await adminClient
    .from("guide_profiles")
    .select("*")
    .eq("user_id", guideId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) return null;

  const typedProfile = profile as GuideProfileRow;
  const [accounts, docsResult, casesResult] = await Promise.all([
    getProfilesByIds(adminClient, [typedProfile.user_id]),
    adminClient
      .from("guide_documents")
      .select(
        "id, guide_id, asset_id, document_type, status, admin_note, reviewed_by, reviewed_at, created_at",
      )
      .eq("guide_id", typedProfile.user_id)
      .order("created_at", { ascending: false }),
    adminClient
      .from("moderation_cases")
      .select(
        "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
      )
      .eq("subject_type", "guide_profile")
      .eq("guide_id", typedProfile.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (docsResult.error) throw docsResult.error;
  if (casesResult.error) throw casesResult.error;

  const documents = (docsResult.data ?? []) as GuideDocumentRow[];
  const assetIds = documents.map((document) => document.asset_id);
  const { data: storageAssets, error: assetsError } = assetIds.length
    ? await adminClient
        .from("storage_assets")
        .select("id, owner_id, bucket_id, object_path, asset_kind, mime_type, byte_size, created_at")
        .in("id", assetIds)
    : { data: [], error: null };

  if (assetsError) throw assetsError;

  const storageAssetMap = new Map(
    ((storageAssets ?? []) as StorageAssetRow[]).map((asset) => [asset.id, asset]),
  );

  const documentsWithAssets = await Promise.all(
    documents.map(async (document) => {
      const storageAsset = storageAssetMap.get(document.asset_id) ?? null;
      if (!storageAsset) {
        return {
          ...document,
          storage_asset: null,
          signed_url: null,
        } satisfies GuideDocumentWithAsset;
      }

      const { data: signedUrlData } = await adminClient.storage
        .from(storageAsset.bucket_id)
        .createSignedUrl(storageAsset.object_path, 60 * 60);

      return {
        ...document,
        storage_asset: storageAsset,
        signed_url: signedUrlData?.signedUrl ?? null,
      } satisfies GuideDocumentWithAsset;
    }),
  );

  return {
    profile: typedProfile,
    account: accounts.get(typedProfile.user_id) ?? null,
    documents: documentsWithAssets,
    moderation_case: casesResult.data
      ? await getModerationCase((casesResult.data as ModerationCaseRow).id)
      : null,
  };
}

export async function getPendingListingReviews(): Promise<ListingModerationRow[]> {
  const { adminClient } = await requireAdminSession();

  const [{ data: draftListings, error: listingsError }, { data: openCases, error: casesError }] =
    await Promise.all([
      adminClient
        .from("listings")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: false }),
      adminClient
        .from("moderation_cases")
        .select(
          "id, subject_type, guide_id, listing_id, review_id, opened_by, assigned_admin_id, status, queue_reason, risk_flags, created_at, updated_at",
        )
        .eq("subject_type", "listing")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ]);

  if (listingsError) throw listingsError;
  if (casesError) throw casesError;

  const listingMap = new Map<Uuid, ListingRow>();
  for (const listing of (draftListings ?? []) as ListingRow[]) {
    listingMap.set(listing.id, listing);
  }

  const openCaseRows = (openCases ?? []) as ModerationCaseRow[];
  const openCaseListingIds = openCaseRows
    .map((item) => item.listing_id)
    .filter(Boolean) as Uuid[];

  if (openCaseListingIds.length) {
    const { data: openCaseListings, error } = await adminClient
      .from("listings")
      .select("*")
      .in("id", openCaseListingIds);

    if (error) throw error;

    for (const listing of (openCaseListings ?? []) as ListingRow[]) {
      listingMap.set(listing.id, listing);
    }
  }

  const listings = [...listingMap.values()].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
  const guideIds = [...new Set(listings.map((listing) => listing.guide_id))];
  const latestCaseByListing = new Map<Uuid, ModerationCaseRow>();
  for (const moderationCase of openCaseRows) {
    if (moderationCase.listing_id && !latestCaseByListing.has(moderationCase.listing_id)) {
      latestCaseByListing.set(moderationCase.listing_id, moderationCase);
    }
  }

  const [accounts, guideProfiles, latestActions] = await Promise.all([
    getProfilesByIds(adminClient, guideIds),
    getGuideProfilesByIds(adminClient, guideIds),
    getLatestActionMap(
      adminClient,
      [...latestCaseByListing.values()].map((item) => item.id),
    ),
  ]);

  return listings.map((listing) => {
    const moderationCase = latestCaseByListing.get(listing.id) ?? null;
    return {
      listing,
      guide_profile: guideProfiles.get(listing.guide_id) ?? null,
      guide_account: accounts.get(listing.guide_id) ?? null,
      moderation_case: moderationCase,
      latest_action: moderationCase ? latestActions.get(moderationCase.id) ?? null : null,
    };
  });
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { adminClient } = await requireAdminSession();

  const [
    pendingGuides,
    draftListings,
    openListingCases,
    openDisputes,
    totalBookings,
  ] = await Promise.all([
    adminClient
      .from("guide_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("verification_status", "submitted"),
    adminClient
      .from("listings")
      .select("id")
      .eq("status", "draft"),
    adminClient
      .from("moderation_cases")
      .select("listing_id")
      .eq("subject_type", "listing")
      .eq("status", "open"),
    adminClient
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    adminClient.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  const pendingListingReviews = new Set([
    ...((draftListings.data ?? []) as Array<{ id: Uuid }>).map((item) => item.id),
    ...((openListingCases.data ?? []) as Array<{ listing_id: Uuid | null }>)
      .map((item) => item.listing_id)
      .filter(Boolean),
  ]).size;

  return {
    pendingGuideApplications: pendingGuides.count ?? 0,
    pendingListingReviews,
    openDisputes: openDisputes.count ?? 0,
    totalBookings: totalBookings.count ?? 0,
  };
}

export async function getAdminNavCounts() {
  const stats = await getAdminDashboardStats();

  return {
    guides: stats.pendingGuideApplications,
    listings: stats.pendingListingReviews,
  };
}

export { requireAdminSession };
