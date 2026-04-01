import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function AuthPage() {
  const authContext = await readAuthContextFromServer();

  if (authContext.missingRoleRecoveryTo) {
    redirect(authContext.missingRoleRecoveryTo);
  }

  if (authContext.canonicalRedirectTo) {
    redirect(authContext.canonicalRedirectTo);
  }

  return (
    <div className="auth-page">
      <Suspense fallback={null}>
        <AuthEntryScreen />
      </Suspense>
    </div>
  );
}
