import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Вход",
};

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
    {
      title: "Регистрация и заявка бесплатны",
      description: "Создайте профиль и отправьте запрос без оплаты.",
    },
    {
      title: "Только проверенные гиды",
      description:
        "Проверяем профиль и документы гида перед работой на платформе.",
    },
    {
      title: "Условия видны заранее",
      description: "Гид предлагает цену и формат поездки до вашего решения.",
    },
    {
      title: "Поможем с заявкой и бронированием",
      description: "Подскажем по входу, откликам и оформлению поездки.",
    },
  ];

  return (
    <section className="relative flex min-h-screen items-stretch justify-center bg-surface px-[clamp(20px,4vw,48px)] py-16">
      <Link
        href="/"
        className="absolute left-[clamp(20px,4vw,48px)] top-6 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        На главную
      </Link>
      <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-2">
        <aside className="hidden flex-col justify-center gap-8 rounded-glass bg-gradient-to-br from-brand-900 to-brand-950 p-[clamp(2rem,4vw,3.5rem)] text-white shadow-glass lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition-colors hover:text-white/80"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Provodnik
          </Link>
          <div className="space-y-4">
            <h1 className="text-[clamp(1.75rem,2.5vw,2.25rem)] font-semibold leading-tight text-white">
              Найдите проверенного гида для поездки
            </h1>
            <p className="text-base leading-7 text-white/80">
              Создайте профиль, отправьте запрос и сравните предложения гидов
              до бронирования.
            </p>
          </div>
          <ul className="space-y-4">
            {trustPoints.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3.5 text-white" />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium leading-6 text-white">
                    {point.title}
                  </span>
                  <span className="block text-xs leading-5 text-white/70">
                    {point.description}
                  </span>
                </span>
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
