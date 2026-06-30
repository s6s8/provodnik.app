"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth/role-routing";
import { isGuideType } from "@/features/auth/guide-type";

type SignUpInput = {
  email: string;
  password: string;
  role: string;
  fullName: string;
  phone?: string;
  guideType?: string;
};

type SignUpResult =
  | { ok: true; dashboardPath: string }
  | { ok: false; error: string };

async function rollbackRecentlyCreatedAuthUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const { data: checkUser, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError) {
    console.error("[signUpAction] auth rollback lookup failed:", lookupError);
    return;
  }

  if (!checkUser?.user) return;

  const createdAt = new Date(checkUser.user.created_at).getTime();
  const now = Date.now();
  if (now - createdAt >= 30_000) return;

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[signUpAction] auth rollback delete failed:", deleteError);
  }
}

export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  // Public signup allowlist: traveler and guide only. Admin and arbitrary roles
  // are rejected before any Supabase call — must be the first executable statement.
  if (input.role !== "traveler" && input.role !== "guide") {
    return { ok: false, error: "forbidden_role" };
  }

  const { email, password, fullName, phone } = input;
  const safeRole = input.role;
  const isGuide = safeRole === "guide";

  // Digits-only canonical form for uniqueness. Keep the runtime check independent
  // from additive DB migrations so guide signup works on the currently deployed DB.
  const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";

  // Guides must be reachable by phone (offer/booking coordination) and must
  // declare what kind of guide they are — both are gated here on the server, not
  // only in the UI, so the API can't be bypassed.
  if (isGuide && !normalizedPhone) {
    return { ok: false, error: "phone_required" };
  }

  const guideType = isGuide ? input.guideType : undefined;
  if (isGuide && !isGuideType(guideType)) {
    return { ok: false, error: "guide_type_required" };
  }

  const admin = createSupabaseAdminClient();

  if (normalizedPhone) {
    const { data: phoneRows, error: phoneLookupError } = await admin
      .from("profiles")
      .select("id, phone")
      .not("phone", "is", null);

    if (phoneLookupError) {
      console.error("[signUpAction] phone lookup failed:", phoneLookupError);
      return { ok: false, error: "internal" };
    }
    const phoneOwner = phoneRows?.find(
      (row) => (row.phone ?? "").replace(/\D/g, "") === normalizedPhone,
    );
    if (phoneOwner) {
      return { ok: false, error: "phone_taken" };
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: safeRole,
      full_name: fullName,
      ...(isGuide ? { guide_type: guideType } : {}),
    },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered") ||
        createError.message.toLowerCase().includes("already been registered") ||
        createError.message.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "already_registered" };
    }
    return { ok: false, error: "internal" };
  }

  const userId = created.user?.id;
  if (!userId) {
    return { ok: false, error: "internal" };
  }

  // The profiles upsert and the app_metadata update were previously unchecked:
  // a failure left an auth user with no usable profile or role claim behind a
  // single generic error. Both are now checked and roll the auth user back, so
  // no orphaned account remains and the caller learns the real cause.
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    role: safeRole,
    email,
    full_name: fullName,
    ...(phone ? { phone } : {}),
  });

  if (profileError) {
    await rollbackRecentlyCreatedAuthUser(admin, userId);
    const message = profileError.message?.toLowerCase() ?? "";
    if (message.includes("phone") && message.includes("duplicate")) {
      return { ok: false, error: "phone_taken" };
    }
    return { ok: false, error: "profile_failed" };
  }

  const { error: roleError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: safeRole },
  });

  if (roleError) {
    await rollbackRecentlyCreatedAuthUser(admin, userId);
    return { ok: false, error: "role_failed" };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // The account is fully provisioned — only the immediate session failed.
    // No orphan: the user can sign in directly with the same credentials.
    return { ok: false, error: "signin_after_signup_failed" };
  }

  const dashboardPath = safeRole === "guide" ? "/guide/profile" : getDashboardPathForRole(safeRole) ?? "/";
  return { ok: true, dashboardPath };
}
