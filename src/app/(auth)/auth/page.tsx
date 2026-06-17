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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface)] px-[clamp(20px,4vw,48px)] py-16">
      <div className="pointer-events-none absolute inset-x-0 top-[-18rem] mx-auto h-[34rem] max-w-[46rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(214,236,224,0.72),rgba(238,247,242,0.28)_48%,rgba(247,250,246,0)_72%)]" />
      <AuthEntryScreen
        role={signupRole}
        next={next}
        errorCode={needsAdminReauth ? "admin-access-denied" : error}
      />
    </section>
  );
}
