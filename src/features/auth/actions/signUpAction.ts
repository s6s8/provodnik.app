"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardPathForRole, isAppRole } from "@/lib/auth/role-routing";

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
  // Anti-dezintermediation guard: public signup is traveler-only.
  // Guide/admin roles are provisioned by invite or admin verification, never via
  // an arbitrary client-supplied `role`. Must be the first executable statement —
  // no Supabase calls, no guide_profiles upsert, no app_metadata mutation when rejected.
  if (input.role !== "traveler") {
    return { ok: false, error: "forbidden_role" };
  }

  const { email, password, role, fullName, phone } = input;
  const safeRole = isAppRole(role) ? role : "traveler";

  const admin = createSupabaseAdminClient();

  // 1. Create user — email_confirm: true skips confirmation email entirely
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

  // 2. Upsert profiles row explicitly — no race with trigger
  await admin.from("profiles").upsert({
    id: userId,
    role: safeRole,
    email,
    full_name: fullName,
    ...(phone ? { phone } : {}),
  });

  // 3. If guide, upsert guide_profiles too
  if (safeRole === "guide") {
    await admin.from("guide_profiles").upsert({
      user_id: userId,
      display_name: fullName,
      specialization: "",
    });
  }

  // 4. Stamp app_metadata.role so custom_access_token_hook always finds it
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: safeRole },
  });

  // 5. Sign in — JWT minted now, hook reads profiles row that definitely exists
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { ok: false, error: "internal" };
  }

  const dashboardPath = getDashboardPathForRole(safeRole) ?? "/";
  return { ok: true, dashboardPath };
}
