import { redirect } from "next/navigation";

import { Check } from "lucide-react";

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

  const trustPoints = [
    "Бесплатно для путешественников",
    "Гиды проходят проверку",
    "Честную цену предлагают сами гиды",
    "Поддержка на каждом шаге",
  ];

  return (
    <section className="relative flex min-h-screen items-stretch justify-center bg-surface px-[clamp(20px,4vw,48px)] py-16">
      <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-2">
        <aside className="hidden flex-col justify-center gap-8 rounded-glass bg-gradient-to-br from-brand-900 to-brand-950 p-[clamp(2rem,4vw,3.5rem)] text-white shadow-glass lg:flex">
          <span className="text-lg font-semibold tracking-tight">Provodnik</span>
          <div className="space-y-4">
            <h1 className="text-[clamp(1.75rem,2.5vw,2.25rem)] font-semibold leading-tight">
              Найдите проверенного местного гида
            </h1>
            <p className="text-base leading-7 text-white/70">
              Создайте профиль за минуту и планируйте поездку вместе с гидами,
              которым доверяют.
            </p>
          </div>
          <ul className="space-y-4">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3.5 text-white" />
                </span>
                <span className="text-sm leading-6 text-white/85">{point}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex items-center justify-center">
          <AuthEntryScreen
            role={signupRole}
            next={next}
            errorCode={needsAdminReauth ? "admin-access-denied" : error}
          />
        </div>
      </div>
    </section>
  );
}
