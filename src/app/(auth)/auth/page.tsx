import { redirect } from "next/navigation";

import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";
import { resolvePostAuthRedirectPath } from "@/lib/auth/safe-redirect";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

type AuthPageProps = {
  searchParams: Promise<{ role?: string | string[]; next?: string | string[] }>;
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

  const authContext = await readAuthContextFromServer();

  if (authContext.missingRoleRecoveryTo) {
    redirect(authContext.missingRoleRecoveryTo);
  }

  if (authContext.canonicalRedirectTo) {
    const destination =
      resolvePostAuthRedirectPath(authContext.role, next) ??
      authContext.canonicalRedirectTo;
    redirect(destination);
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-[clamp(20px,4vw,48px)] py-16">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(0,88,190,0.22),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[rgba(0,88,190,0.08)] to-transparent" />
      <AuthEntryScreen role={signupRole} next={next} />
    </section>
  );
}
