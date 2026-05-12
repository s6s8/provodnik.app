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
  // Anti-dezintermediation guard: public signup is traveler-only.
  // Guide/admin roles are provisioned by invite or admin verification, never via
  // an arbitrary client-supplied `role`. Must be the first executable statement —
  // no Supabase calls, no guide_profiles upsert, no app_metadata mutation when rejected.
  if (input.role !== "traveler") {
    return { ok: false, error: "forbidden_role" };
  }

  const { email, password, fullName, phone } = input;
  const safeRole = "traveler" as const;

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

  await admin.from("profiles").upsert({
    id: userId,
    role: safeRole,
    email,
    full_name: fullName,
    ...(phone ? { phone } : {}),
  });

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: safeRole },
  });

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
