import "server-only";

import type { AppRole } from "@/lib/auth/types";
import { logError } from "@/lib/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/moderation";
import type { Uuid } from "@/lib/supabase/types";
import {
  ADMIN_USERS_PAGE_SIZE,
  isDemoEmail,
  maskEmail,
  maskPhone,
  type AccountStatus,
  type AdminUsersFilter,
  type GuideType,
  type GuideVerificationStatus,
} from "@/data/admin-users";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type AdminUserGuideInfo = {
  verificationStatus: GuideVerificationStatus;
  guideType: GuideType | null;
  isAvailable: boolean | null;
};

export type AdminUserListItem = {
  id: Uuid;
  fullName: string | null;
  maskedEmail: string;
  maskedPhone: string;
  role: AppRole;
  accountStatus: AccountStatus;
  isDemo: boolean;
  createdAt: string;
  guide: AdminUserGuideInfo | null;
};

export type AdminUsersPage = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminAuditEntry = {
  id: Uuid;
  action: string;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminUserDetail = {
  id: Uuid;
  fullName: string | null;
  maskedEmail: string;
  maskedPhone: string;
  role: AppRole;
  accountStatus: AccountStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  guide: (AdminUserGuideInfo & { bio: string | null; regions: string[]; languages: string[] }) | null;
  audit: AdminAuditEntry[];
};

const DEMO_DOMAIN_OR = "email.ilike.%@example.com,email.ilike.%@provodnik.test";

function safePostgrestSearchTerm(input: string): string | null {
  const normalized = input
    .trim()
    .replace(/[,%()]/g, " ")
    .replace(/[\\*]/g, " ")
    .replace(/[%_]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return normalized.length >= 2 ? `%${normalized}%` : null;
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: AppRole;
  account_status: AccountStatus;
  created_at: string;
};

type GuideProfileLite = {
  user_id: string;
  verification_status: GuideVerificationStatus;
  guide_type: GuideType | null;
  is_available: boolean | null;
};

async function getGuideInfoByIds(
  adminClient: AdminClient,
  ids: string[],
): Promise<Map<string, AdminUserGuideInfo>> {
  if (!ids.length) return new Map();
  const { data, error } = await adminClient
    .from("guide_profiles")
    .select("user_id, verification_status, guide_type, is_available")
    .in("user_id", ids);
  if (error) throw error;
  return new Map(
    ((data ?? []) as GuideProfileLite[]).map((row) => [
      row.user_id,
      {
        verificationStatus: row.verification_status,
        guideType: row.guide_type,
        isAvailable: row.is_available,
      },
    ]),
  );
}

/** Count OTHER active admins (excluding a given user) — powers last-admin guards. */
export async function countOtherActiveAdmins(
  adminClient: AdminClient,
  excludeUserId: string,
): Promise<number> {
  const { count, error } = await adminClient
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("account_status", "active")
    .neq("id", excludeUserId);
  if (error) throw error;
  return count ?? 0;
}

export async function listAdminUsers(filter: AdminUsersFilter): Promise<AdminUsersPage> {
  const { adminClient } = await requireAdminSession();
  const page = Math.max(1, filter.page);
  const pageSize = ADMIN_USERS_PAGE_SIZE;

  // When filtering by guide-specific fields, resolve the matching user ids from
  // guide_profiles first, then page the profiles query by that id set.
  let restrictIds: string[] | null = null;
  if (filter.guideStatus || filter.guideType) {
    let gq = adminClient.from("guide_profiles").select("user_id");
    if (filter.guideStatus) gq = gq.eq("verification_status", filter.guideStatus);
    if (filter.guideType) gq = gq.eq("guide_type", filter.guideType);
    const { data, error } = await gq;
    if (error) throw error;
    restrictIds = ((data ?? []) as { user_id: string }[]).map((r) => r.user_id);
    if (restrictIds.length === 0) {
      return { items: [], total: 0, page, pageSize, pageCount: 0 };
    }
  }

  let query = adminClient
    .from("profiles")
    .select("id, full_name, email, phone, role, account_status, created_at", {
      count: "exact",
    });

  if (restrictIds) query = query.in("id", restrictIds);
  if (filter.role) query = query.eq("role", filter.role);
  if (filter.status) query = query.eq("account_status", filter.status);
  if (filter.q) {
    const term = safePostgrestSearchTerm(filter.q);
    if (term) {
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }
  }
  if (filter.demo === "demo") {
    query = query.or(DEMO_DOMAIN_OR);
  } else if (filter.demo === "real") {
    query = query
      .not("email", "ilike", "%@example.com")
      .not("email", "ilike", "%@provodnik.test");
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  const rows = (data ?? []) as ProfileRow[];
  const guideRoleIds = rows.filter((r) => r.role === "guide").map((r) => r.id);
  const guideInfo = await getGuideInfoByIds(adminClient, guideRoleIds);

  const items: AdminUserListItem[] = rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    maskedEmail: maskEmail(row.email),
    maskedPhone: maskPhone(row.phone),
    role: row.role,
    accountStatus: row.account_status,
    isDemo: isDemoEmail(row.email),
    createdAt: row.created_at,
    guide: row.role === "guide" ? guideInfo.get(row.id) ?? null : null,
  }));

  const total = count ?? items.length;
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getUserAuditTimeline(
  adminClient: AdminClient,
  targetId: string,
): Promise<AdminAuditEntry[]> {
  const { data, error } = await adminClient
    .from("admin_audit_log")
    .select("id, action, actor_id, metadata, created_at")
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    logError("admin-users.auditTimeline", error, { targetId });
    return [];
  }
  const rows = (data ?? []) as {
    id: string;
    action: string;
    actor_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }[];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])];
  const actorNames = new Map<string, string | null>();
  if (actorIds.length) {
    const { data: actors } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);
    for (const actor of (actors ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
      actorNames.set(actor.id, actor.full_name?.trim() || maskEmail(actor.email));
    }
  }
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actor_id ? actorNames.get(row.actor_id) ?? null : null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }));
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const { adminClient } = await requireAdminSession();

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, account_status, status_reason, status_changed_at, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const row = profile as ProfileRow & {
    status_reason: string | null;
    status_changed_at: string | null;
    updated_at: string;
  };

  let guide: AdminUserDetail["guide"] = null;
  if (row.role === "guide") {
    const { data: guideRow } = await adminClient
      .from("guide_profiles")
      .select("verification_status, guide_type, is_available, bio, regions, languages")
      .eq("user_id", userId)
      .maybeSingle();
    if (guideRow) {
      const g = guideRow as GuideProfileLite & {
        bio: string | null;
        regions: string[] | null;
        languages: string[] | null;
      };
      guide = {
        verificationStatus: g.verification_status,
        guideType: g.guide_type,
        isAvailable: g.is_available,
        bio: g.bio,
        regions: g.regions ?? [],
        languages: g.languages ?? [],
      };
    }
  }

  const audit = await getUserAuditTimeline(adminClient, userId);

  return {
    id: row.id,
    fullName: row.full_name,
    maskedEmail: maskEmail(row.email),
    maskedPhone: maskPhone(row.phone),
    role: row.role,
    accountStatus: row.account_status,
    statusReason: row.status_reason,
    statusChangedAt: row.status_changed_at,
    isDemo: isDemoEmail(row.email),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    guide,
    audit,
  };
}

/** Fetch the minimal server-trusted target fields the action guards need. */
export async function getTargetForGuards(
  adminClient: AdminClient,
  userId: string,
): Promise<{ id: string; email: string | null; role: AppRole; accountStatus: AccountStatus } | null> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, role, account_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as { id: string; email: string | null; role: AppRole; account_status: AccountStatus };
  return { id: row.id, email: row.email, role: row.role, accountStatus: row.account_status };
}

/** Append an audit row via the service-role client (server-only boundary). */
export async function logAdminAudit(input: {
  actorId: string;
  action: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("admin_audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: "user",
    target_id: input.targetId,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}
