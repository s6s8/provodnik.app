import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { flags } from "@/lib/flags";

import { SiteHeader } from "./site-header";

export async function SiteHeaderServer() {
  const auth = await readAuthContextFromServer();

  return (
    <SiteHeader
      isAuthenticated={auth.isAuthenticated}
      role={auth.role}
      email={auth.email}
      fullName={auth.fullName}
      avatarUrl={auth.avatarUrl}
      canonicalRedirectTo={auth.canonicalRedirectTo}
      userId={auth.userId}
      notificationsEnabled={flags.FEATURE_TR_NOTIFICATIONS}
    />
  );
}
