"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth/role-routing";
import { rateLimit } from "@/lib/rate-limit";
import { isGuideType } from "@/features/auth/guide-type";

// Bounds untrusted signup input server-side (the action can be called directly,
// not only via the form). Role/guideType keep their dedicated error codes below.
const SignUpSchema = z.object({
  email: z.email(),
  // Mirror the client rule (auth-entry-screen: password.length < 6) so a valid
  // 6-char password isn't accepted by the form yet rejected by the server.
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(32).optional(),
  role: z.string(),
  guideType: z.string().optional(),
});

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

  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { password, fullName, phone } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const safeRole = input.role;
  const isGuide = safeRole === "guide";

  // Digits-only canonical form mirrors the generated `profiles.phone_normalized`
  // column (regexp_replace [^0-9]). Empty/blank phone stays optional and is never
  // checked for uniqueness.
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

  // Throttle anonymous account creation by IP and by email (mirrors the
  // forgot-password limiter) so the endpoint can't be used to mass-squat emails
  // or spam the registry.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const ipLimit = await rateLimit(`signup:ip:${ip}`, 10, 3600);
  if (!ipLimit.success) {
    return { ok: false, error: "rate_limited" };
  }
  const emailLimit = await rateLimit(`signup:email:${email}`, 5, 3600);
  if (!emailLimit.success) {
    return { ok: false, error: "rate_limited" };
  }

  const admin = createSupabaseAdminClient();

  if (normalizedPhone) {
    const { data: phoneOwner, error: phoneLookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("phone_normalized", normalizedPhone)
      .maybeSingle();

    if (phoneLookupError) {
      console.error("[signUpAction] phone lookup failed:", phoneLookupError);
      return { ok: false, error: "internal" };
    }
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
    // Backstop for the concurrent-signup race: the DB unique index on
    // phone_normalized fired between the pre-check and the upsert.
    const message = profileError.message?.toLowerCase() ?? "";
    if (message.includes("phone_normalized")) {
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
