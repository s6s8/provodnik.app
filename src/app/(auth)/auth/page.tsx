import { redirect } from "next/navigation";

import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";
import {
  isAdminWorkspacePath,
  resolvePostAuthRedirectPath,
} from "@/lib/auth/safe-redirect";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

type AuthPageProps = {
  searchParams: Promise<{
    role?: string | string[];
    next?: string | string[];
    error?: string | string[];
  }>;
};

function resolveSearchParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}

function resolveSignupRole(
  raw: string | string[] | undefined,
): "traveler" | "guide" {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "traveler" || value === "guide") {
    return value;
  }
  return "traveler";
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const signupRole = resolveSignupRole(params.role);
  const next = resolveSearchParam(params.next);
  const error = resolveSearchParam(params.error);

  const authContext = await readAuthContextFromServer();

  if (authContext.missingRoleRecoveryTo && error !== "missing-role") {
    redirect(authContext.missingRoleRecoveryTo);
  }

  const needsAdminReauth =
    authContext.isAuthenticated &&
    authContext.role !== "admin" &&
    isAdminWorkspacePath(next);

  if (authContext.canonicalRedirectTo && !needsAdminReauth) {
    const destination =
      resolvePostAuthRedirectPath(authContext.role, next) ??
      authContext.canonicalRedirectTo;
    redirect(destination);
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-[clamp(20px,4vw,48px)] py-16">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950" />
      <div className="pointer-events-none absolute inset-x-1/4 top-0 h-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-primary/10 to-transparent" />
      <AuthEntryScreen
        role={signupRole}
        next={next}
        errorCode={needsAdminReauth ? "admin-access-denied" : error}
      />
    </section>
  );
}
