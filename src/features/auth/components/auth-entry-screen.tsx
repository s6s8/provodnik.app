"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getDashboardPathForRole, isAppRole } from "@/lib/auth/role-routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signUpAction } from "@/features/auth/actions/signUpAction";

const hasEnv = hasSupabaseEnv();

const roles = [
  { value: "traveler", label: "Путешественник" },
  { value: "guide", label: "Гид" },
  { value: "admin", label: "Оператор" },
] as const;

type AuthFormMode = "sign-in" | "sign-up";
type RoleValue = (typeof roles)[number]["value"];

function getFriendlyAuthError(code: string): string {
  switch (code) {
    case "already_registered":
      return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
    case "internal":
      return "Что-то пошло не так. Попробуйте ещё раз.";
  }

  const normalized = code.toLowerCase();

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

export function AuthEntryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole: RoleValue =
    searchParams.get("role") === "guide" ? "guide" : "traveler";

  const [mode, setMode] = useState<AuthFormMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleValue>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setError(getFriendlyAuthError(signInError.message));
          return;
        }

        const userRole = data.user?.app_metadata?.role;
        const dashboardPath = isAppRole(userRole)
          ? getDashboardPathForRole(userRole)
          : null;

        if (!dashboardPath) {
          window.location.href = "/api/auth/signout";
          return;
        }

        router.replace(dashboardPath);
        router.refresh();
        return;
      }

      // Sign-up: server action creates user + profile + sets app_metadata atomically
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

      router.replace(result.dashboardPath);
      router.refresh();
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
    <div className="w-[min(100%,30rem)] rounded-glass border border-glass-border bg-glass p-[clamp(1.75rem,4vw,2.5rem)] shadow-glass backdrop-blur-[20px]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Provodnik
            </Link>
          </div>
        </div>
      </div>

      <div>
        {!hasEnv ? (
          <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              В этой среде вход пока недоступен. Проверьте значения{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> в{" "}
              <code>.env.local</code>.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isSignUp ? (
            <>
              <div className="grid gap-2.5">
                <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                  Как к вам обращаться
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Например, Анна Смирнова"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 shadow-none focus-visible:border-ring"
                  />
                </div>
              </div>
              <div className="grid gap-2.5">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Телефон (необязательно)
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 shadow-none focus-visible:border-ring"
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="grid gap-2.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 shadow-none focus-visible:border-ring"
              />
            </div>
          </div>

          <div className="grid gap-2.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {isSignUp ? "Создайте пароль" : "Пароль"}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Минимум 6 символов" : "Введите пароль"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 pr-14 shadow-none focus-visible:border-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
                className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Забыли пароль?
              </Link>
            </div>
          ) : null}

          {isSignUp ? (
            <div className="grid gap-2.5">
              <span className="text-sm font-medium text-foreground">
                Выберите роль
              </span>
              <div className="grid grid-cols-2 gap-3">
                {roles
                  .filter((option) => option.value !== "admin")
                  .map((option) => {
                    const isActive = role === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-transparent text-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        aria-pressed={isActive}
                      >
                        {option.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-[1.4rem] border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>{success}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full rounded-full"
            disabled={isSubmitting || !hasEnv}
          >
            {isSubmitting ? `${ctaLabel}...` : ctaLabel}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => handleModeChange(isSignUp ? "sign-in" : "sign-up")}
          className="mt-6 inline-flex w-fit items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {toggleLabel}
        </button>
      </div>
    </div>
  );
}
