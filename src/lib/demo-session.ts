export type DemoRole = "traveler" | "guide" | "admin";

export type DemoSession = {
  mode: "demo";
  role: DemoRole;
  createdAt: string;
};

export const DEMO_SESSION_COOKIE = "provodnik_demo_session";

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function parseDemoSessionCookieValue(value: string | undefined): DemoSession | null {
  if (!value) return null;
  const decoded = safeJsonParse(decodeURIComponent(value));
  if (!decoded || typeof decoded !== "object") return null;

  const mode = (decoded as { mode?: unknown }).mode;
  const role = (decoded as { role?: unknown }).role;
  const createdAt = (decoded as { createdAt?: unknown }).createdAt;

  if (mode !== "demo") return null;
  if (role !== "traveler" && role !== "guide" && role !== "admin") return null;
  if (typeof createdAt !== "string") return null;

  return { mode: "demo", role, createdAt };
}

export function serializeDemoSessionCookieValue(session: DemoSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function createDemoSession(role: DemoRole): DemoSession {
  return { mode: "demo", role, createdAt: new Date().toISOString() };
}

export function readDemoSessionFromDocument(): DemoSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEMO_SESSION_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(`${DEMO_SESSION_COOKIE}=`.length);
  return parseDemoSessionCookieValue(value);
}

export function writeDemoSessionToDocument(role: DemoRole) {
  if (typeof document === "undefined") return;
  const value = serializeDemoSessionCookieValue(createDemoSession(role));
  document.cookie = `${DEMO_SESSION_COOKIE}=${value}; Path=/; SameSite=Lax`;
}

export function clearDemoSessionFromDocument() {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

