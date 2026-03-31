"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getDashboardPathForRole,
  isAppRole,
} from "@/lib/auth/role-routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const hasEnv = hasSupabaseEnv();

const roles = [
  { value: "traveler", label: "Путешественник" },
  { value: "guide", label: "Гид" },
  { value: "admin", label: "Оператор" },
] as const;

const profileLookupDelays = [0, 150, 400, 900] as const;
const missingRoleMessage =
  "Аккаунт авторизован, но роль профиля не определена. Вернитесь на страницу входа позже или обратитесь в поддержку.";

type AuthFormMode = "sign-in" | "sign-up";
type RoleValue = (typeof roles)[number]["value"];
type ProfileRoleQuery = {
  data: { role: string | null } | null;
  error: { message: string } | null;
};

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }

  if (normalized.includes("user already registered")) {
    return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Подтвердите email по письму и попробуйте снова.";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password must be at least")
  ) {
    return "Пароль слишком короткий. Используйте не менее 6 символов.";
  }

  return message;
}

async function resolveDashboardPathForUser(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
) {
  for (const delayMs of profileLookupDelays) {
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    const { data: profile, error } = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()) as ProfileRoleQuery;

    if (error) {
      throw new Error(error.message);
    }

    if (isAppRole(profile?.role)) {
      return getDashboardPathForRole(profile.role);
    }
  }

  return null;
}

export function AuthEntryScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthFormMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<RoleValue>("traveler");
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
      const supabase = createSupabaseBrowserClient();

      if (mode === "sign-in") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setError(getFriendlyAuthError(signInError.message));
          return;
        }

        if (!data.user) {
          setError("Не удалось получить данные аккаунта после входа.");
          return;
        }

        const dashboardPath = await resolveDashboardPathForUser(supabase, data.user.id);

        if (!dashboardPath) {
          await supabase.auth.signOut();
          setError(missingRoleMessage);
          return;
        }

        router.replace(dashboardPath);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            role,
          },
        },
      });

      if (signUpError) {
        setError(getFriendlyAuthError(signUpError.message));
        return;
      }

      if (!data.session) {
        setPassword("");
        setMode("sign-in");
        setSuccess(
          "Аккаунт создан. Проверьте почту, подтвердите адрес и затем войдите с email и паролем.",
        );
        return;
      }

      if (!data.user) {
        setError("Аккаунт создан, но данные пользователя пока недоступны. Попробуйте войти снова.");
        return;
      }

      const dashboardPath = await resolveDashboardPathForUser(supabase, data.user.id);

      if (!dashboardPath) {
        await supabase.auth.signOut();
        setError(
          "Аккаунт создан, но роль профиля пока не определилась. Подтвердите email, затем попробуйте войти снова.",
        );
        return;
      }

      router.replace(dashboardPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? getFriendlyAuthError(submitError.message)
          : "Не удалось выполнить авторизацию. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "Новый профиль" : "С возвращением";
  const subtitle = isSignUp
    ? "Создайте доступ и выберите формат кабинета."
    : "Войдите по email и паролю, чтобы открыть свой кабинет.";
  const ctaLabel = isSignUp ? "Создать профиль" : "Войти";
  const toggleLabel = isSignUp
    ? "Уже есть аккаунт? Войти"
    : "Нет аккаунта? Создать профиль";

  return (
    <Card className="auth-card glass-panel">
      <CardHeader className="space-y-0 p-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href="/" className="auth-toggle inline-flex w-fit items-center">
              Provodnik
            </Link>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {isSignUp ? "Регистрация" : "Вход"}
              </p>
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </CardTitle>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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
            <div className="auth-field">
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
                  className="auth-field-input pl-11"
                  required={isSignUp}
                />
              </div>
            </div>
          ) : null}

          <div className="auth-field">
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
                className="auth-field-input pl-11"
                required
              />
            </div>
          </div>

          <div className="auth-field">
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
                className="auth-field-input pl-11 pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="auth-toggle absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {isSignUp ? (
            <div className="auth-field">
              <span className="text-sm font-medium text-foreground">Выберите роль</span>
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

          <Button type="submit" className="h-12 w-full rounded-full" disabled={isSubmitting || !hasEnv}>
            {isSubmitting ? `${ctaLabel}...` : ctaLabel}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => handleModeChange(isSignUp ? "sign-in" : "sign-up")}
          className="auth-toggle mt-6 inline-flex w-fit items-center text-sm"
        >
          {toggleLabel}
        </button>
      </CardContent>
    </Card>
  );
}
