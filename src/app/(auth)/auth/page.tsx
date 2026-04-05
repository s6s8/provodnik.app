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
    <section className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center px-[clamp(20px,4vw,48px)] py-12">
      <AuthEntryScreen />
    </section>
  );
}
