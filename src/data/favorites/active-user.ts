import { getDemoUserIdForRole } from "@/data/notifications/demo";
import { readDemoSessionFromDocument } from "@/lib/demo-session";

const DEFAULT_FAVORITES_USER_ID = "usr_device_anonymous";

export function getActiveFavoritesUserId(): string {
  const session = readDemoSessionFromDocument();
  if (!session) return DEFAULT_FAVORITES_USER_ID;
  return getDemoUserIdForRole(session.role);
}

