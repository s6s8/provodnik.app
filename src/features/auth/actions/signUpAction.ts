"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth/role-routing";

type SignUpInput = {
  email: string;
  password: string;
  role: string;
  fullName: string;
  phone?: string;
};

type SignUpResult =
  | { ok: true; dashboardPath: string }
  | { ok: false; error: string };

export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  // Public signup allowlist: traveler and guide only. Admin and arbitrary roles
  // are rejected before any Supabase call — must be the first executable statement.
  if (input.role !== "traveler" && input.role !== "guide") {
    return { ok: false, error: "forbidden_role" };
  }

  const { email, password, fullName, phone } = input;
  const safeRole = input.role;

  const admin = createSupabaseAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: safeRole, full_name: fullName },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered") ||
        createError.message.toLowerCase().includes("already been registered") ||
        createError.message.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "already_registered" };
    }
    return { ok: false, error: "internal" };
  }

  const userId = created.user.id;

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
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "profile_failed" };
  }

  const { error: roleError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: safeRole },
  });

  if (roleError) {
    await admin.auth.admin.deleteUser(userId);
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

  const dashboardPath = getDashboardPathForRole(safeRole) ?? "/";
  return { ok: true, dashboardPath };
}
