import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { GuideBottomNav } from "@/components/shared/guide-bottom-nav";
import { PhoneRequiredDialog } from "@/features/guide/components/phone-required-dialog";
import { roleHasAccess } from "@/lib/auth/role-routing";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Guides with no phone exist in production (signed up before the phone gate, or
 * promoted via the old admin role-flip bypass). They stay publicly visible —
 * hiding them would punish guides for our bug — but must fill the phone in
 * before using the workspace. Read-failure never blocks: only a confirmed empty
 * phone raises the prompt.
 */
async function hasNoPhoneOnFile(auth: { source: string; userId: string | null }) {
  if (auth.source !== "supabase" || !auth.userId) return false;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error || !data) return false;
  return !(data.phone as string | null)?.trim();
}

export default async function GuideLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/guide/inbox");
  }

  if (auth.accountStatus && auth.accountStatus !== "active") {
    redirect("/auth?error=account-suspended");
  }

  if (!auth.role) {
    redirect(auth.missingRoleRecoveryTo ?? "/auth?error=missing-role");
  }

  if (!roleHasAccess(auth.role, "guide")) {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  const phoneMissing = await hasNoPhoneOnFile(auth);

  return (
    <>
      <div className="pb-[calc(64px+env(safe-area-inset-bottom)+12px)] md:pb-0">
        {children}
      </div>
      <GuideBottomNav />
      {phoneMissing ? <PhoneRequiredDialog /> : null}
    </>
  );
}
