import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { flags } from "@/lib/flags";
import { hiddenNavHrefsForFlags } from "@/lib/navigation";

import { TravelerBottomNav } from "./traveler-bottom-nav";

export async function TravelerBottomNavServer() {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated || auth.role !== "traveler") {
    return null;
  }

  return (
    <TravelerBottomNav
      hiddenNavHrefs={hiddenNavHrefsForFlags((flag) => flags[flag])}
    />
  );
}
