"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveCanonicalRole } from "@/lib/auth/role-routing";
import {
  isAdminWorkspacePath,
  resolvePostAuthRedirectPath,
} from "@/lib/auth/safe-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signUpAction } from "@/features/auth/actions/signUpAction";

type AuthFormMode = "sign-in" | "sign-up";

function getFriendlyAuthError(code: string): string {
  switch (code) {
    case "already_registered":
      return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
    case "internal":
      return "Что-то пошло не так. Попробуйте ещё раз.";
    case "profile_failed":
    case "role_failed":
      return "Не удалось завершить регистрацию. Попробуйте ещё раз.";
    case "signin_after_signup_failed":
      return "Аккаунт создан. Войдите по своему email и паролю.";
    case "forbidden_role":
      return "Регистрация для этой роли недоступна.";
  }

  const normalized = code.toLowerCase();

  if (
    normalized.includes("database error") ||
    normalized.includes("querying schema") ||
    normalized.includes("error granting user")
  ) {
    return "Не удалось завершить вход: ошибка выдачи сессии. Попробуйте ещё раз через минуту или напишите в поддержку.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (normalized.includes("user already registered")) {
    return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Подтвердите email по письму и попробуйте снова.";
  }
  if (normalized.includes("password should be at least") || normalized.includes("password must be at least")) {
    return "Пароль слишком короткий. Используйте не менее 6 символов.";
  }

  return "Что-то пошло не так. Попробуйте ещё раз.";
}

type AuthEntryScreenProps = {
  role?: "traveler" | "guide";
  next?: string;
  errorCode?: string;
};

export function AuthEntryScreen({
  role = "traveler",
  next,
  errorCode,
}: AuthEntryScreenProps) {
  const [mode, setMode] = useState<AuthFormMode>(
    role === "guide" ? "sign-up" : "sign-in",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function handleModeChange(nextMode: AuthFormMode) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedEmail) {
      setError("Введите email, чтобы продолжить.");
      return;
    }
    if (!password) {
      setError("Введите пароль, чтобы продолжить.");
      return;
    }
    if (mode === "sign-up" && !trimmedFullName) {
      setError("Укажите имя, которое нужно сохранить в профиле.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        const supabase = createSupabaseBrowserClient();
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

        if (signInError) {
          setError(getFriendlyAuthError(signInError.message));
          return;
        }

        const signedInUser = signInData.user;
        if (!signedInUser) {
          setError("Не удалось получить данные сессии. Попробуйте ещё раз.");
          return;
        }

        // Ensure the browser client has the new session before profiles.role lookup (AP-038).
        await supabase.auth.getSession();

        let profileRole: string | null | undefined;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", signedInUser.id)
          .maybeSingle();

        if (!profileError) {
          profileRole = profile?.role ?? null;
        }

        const userRole = resolveCanonicalRole({
          profileRole,
          appMetadataRole: signedInUser.app_metadata?.role as string | undefined,
          userMetadataRole: signedInUser.user_metadata?.role as string | undefined,
        });

        if (profileError && next && isAdminWorkspacePath(next) && userRole !== "admin") {
          setError(
            "Не удалось проверить права администратора после входа. Попробуйте ещё раз или напишите в поддержку.",
          );
          return;
        }

        if (!userRole) {
          setError(
            profileError
              ? "Не удалось загрузить профиль после входа. Попробуйте ещё раз или напишите в поддержку."
              : "Не удалось определить роль аккаунта. Выйдите и войдите снова или напишите в поддержку.",
          );
          return;
        }

        if (next && isAdminWorkspacePath(next) && userRole !== "admin") {
          setError(
            "У этого аккаунта нет прав администратора. Войдите под админским email или обратитесь к владельцу доступа.",
          );
          return;
        }

        const destination = resolvePostAuthRedirectPath(userRole, next);

        if (!destination) {
          setError(
            "Не удалось определить кабинет для входа. Напишите в поддержку.",
          );
          return;
        }

        window.location.assign(destination);
        return;
      }

      // Sign-up: server action creates user + profile + sets app_metadata atomically.
      const result = await signUpAction({
        email: trimmedEmail,
        password,
        role,
        fullName: trimmedFullName,
        phone: phone.trim() || undefined,
      });

      if (!result.ok) {
        setError(getFriendlyAuthError(result.error));
        return;
      }

      window.location.assign(
        resolvePostAuthRedirectPath(role, next) ?? result.dashboardPath,
      );
    } catch {
      setError("Не удалось выполнить авторизацию. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const ctaLabel = isSignUp ? "Создать профиль" : "Войти";
  const toggleLabel = isSignUp
    ? "Уже есть аккаунт? Войти"
    : "Нет аккаунта? Создать профиль";

  return (
    <div className="relative z-10 w-[min(100%,26rem)] rounded-[var(--card-radius)] border border-[var(--outline-variant)] bg-white p-8 font-sans text-[var(--on-surface)] shadow-[var(--card-shadow)]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 text-[var(--on-surface)] transition-colors duration-200 hover:text-[var(--primary)]"
            >
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[var(--primary)] text-base font-bold text-white">
                P
              </span>
              <span className="text-xl font-bold tracking-[-0.02em]">Provodnik</span>
            </Link>
          </div>
        </div>
      </div>

      <div>
        {!hasSupabaseEnv() ? (
          <div className="mt-8 flex items-start gap-3 rounded-[14px] border border-[var(--outline-variant)] bg-[var(--brand-50)] px-4 py-3 text-sm leading-6 text-[var(--on-surface-muted)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Вход временно недоступен. Напишите в поддержку.
            </p>
          </div>
        ) : null}

        {errorCode === "missing-role" ? (
          <div className="mt-8 flex items-start gap-3 rounded-[14px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Не удалось определить роль аккаунта. Выйдите и войдите снова или
              напишите в поддержку.
            </p>
          </div>
        ) : null}

        {errorCode === "admin-access-denied" ? (
          <div className="mt-8 flex items-start gap-3 rounded-[14px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Для входа в админку нужен аккаунт с ролью администратора. Войдите
              под админским email или сначала выйдите из текущего аккаунта.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isSignUp ? (
            <>
              <div className="grid gap-2.5">
                <label htmlFor="full-name" className="text-sm font-medium text-[var(--on-surface)]">
                  Как к вам обращаться
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-muted)]" />
                  <Input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Например, Анна Смирнова"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="min-h-[3.25rem] w-full rounded-[14px] border border-[var(--outline-variant)] bg-white pl-11 text-[var(--on-surface)] shadow-none placeholder:text-[var(--on-surface-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              <div className="grid gap-2.5">
                <label htmlFor="phone" className="text-sm font-medium text-[var(--on-surface)]">
                  Телефон (необязательно)
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-muted)]" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="min-h-[3.25rem] w-full rounded-[14px] border border-[var(--outline-variant)] bg-white pl-11 text-[var(--on-surface)] shadow-none placeholder:text-[var(--on-surface-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="grid gap-2.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--on-surface)]">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-muted)]" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-[3.25rem] w-full rounded-[14px] border border-[var(--outline-variant)] bg-white pl-11 text-[var(--on-surface)] shadow-none placeholder:text-[var(--on-surface-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-2.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--on-surface)]">
              {isSignUp ? "Создайте пароль" : "Пароль"}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-muted)]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Минимум 6 символов" : "Введите пароль"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-[3.25rem] w-full rounded-[14px] border border-[var(--outline-variant)] bg-white pl-11 pr-14 text-[var(--on-surface)] shadow-none placeholder:text-[var(--on-surface-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center text-[var(--on-surface-muted)] transition-colors duration-200 hover:text-[var(--on-surface)]"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {!isSignUp ? (
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[var(--primary)] transition-colors duration-200 hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-[14px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-[14px] border border-primary/15 bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--on-surface)]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>{success}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full rounded-[14px] border-transparent bg-[var(--primary)] font-semibold text-white shadow-[0_10px_24px_-18px_rgba(10,40,28,0.45)] hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_18px_32px_-22px_rgba(10,40,28,0.45)]"
            disabled={isSubmitting || !hasSupabaseEnv() || !hydrated}
          >
            {isSubmitting ? `${ctaLabel}...` : ctaLabel}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => handleModeChange(isSignUp ? "sign-in" : "sign-up")}
          className="mt-6 inline-flex w-fit items-center text-sm font-medium text-[var(--primary)] transition-colors duration-200 hover:underline"
        >
          {toggleLabel}
        </button>
      </div>
    </div>
  );
}
