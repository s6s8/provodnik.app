"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
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
    return "Подтвердите email по письму от Supabase, затем попробуйте войти снова.";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleModeChange(nextMode: AuthFormMode) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  }

  if (!hasEnv) {
    return (
      <Card className="glass-panel rounded-[2.2rem] border border-white/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="size-4 text-amber-500" />
            Supabase не настроен
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            В этом окружении не заданы ключи Supabase. Публичную витрину можно
            смотреть как обычно, а рабочие кабинеты доступны через локальный
            демо-режим в защищенной части приложения.
          </p>
          <p>
            Для реального входа укажите{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            и{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            в <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>.
          </p>
        </CardContent>
      </Card>
    );
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
  const title = isSignUp ? "Создать аккаунт" : "Войти в Provodnik";
  const subtitle = isSignUp
    ? "Регистрация создает профиль и сразу привязывает роль кабинета."
    : "Войдите по email и паролю, а мы откроем нужный кабинет по роли профиля.";

  return (
    <Card className="glass-panel rounded-[2.2rem] border border-white/70">
      <CardHeader className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {isSignUp ? "Регистрация" : "Авторизация"}
        </p>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-[1.6rem] border border-white/60 bg-white/50 p-1">
          <button
            type="button"
            onClick={() => handleModeChange("sign-in")}
            className={`rounded-[1.2rem] px-4 py-3 text-sm font-medium transition ${
              mode === "sign-in"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("sign-up")}
            className={`rounded-[1.2rem] px-4 py-3 text-sm font-medium transition ${
              mode === "sign-up"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp ? (
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                Как к вам обращаться
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Например, Анна Смирнова"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-12 rounded-2xl bg-white/82 pl-10"
                  required={isSignUp}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl bg-white/82 pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {isSignUp ? "Создайте пароль" : "Пароль"}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Минимум 6 символов" : "Введите пароль"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl bg-white/82 pl-10"
                required
              />
            </div>
          </div>

          {isSignUp ? (
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Роль в сервисе
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as RoleValue)}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-input bg-white/82 px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-muted-foreground">
                После регистрации мы откроем кабинет, который соответствует роли в вашем
                профиле.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4" />
              <p>{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4" />
              <p>{success}</p>
            </div>
          ) : null}

          <div className="space-y-3 border-t border-border/70 pt-4">
            <Button type="submit" className="h-12 w-full rounded-full" disabled={isSubmitting}>
              {isSubmitting
                ? isSignUp
                  ? "Создаем аккаунт..."
                  : "Входим..."
                : isSignUp
                  ? "Создать аккаунт"
                  : "Войти"}
            </Button>
            <p className="text-xs leading-6 text-muted-foreground">
              {isSignUp
                ? "Имя и роль сохранятся в профиле Supabase. Если проект требует подтверждения email, завершите регистрацию по письму и затем войдите."
                : "После входа маршрут определяется по роли в профиле: путешественник, гид или оператор."}
            </p>
            <button
              type="button"
              onClick={() => handleModeChange(isSignUp ? "sign-in" : "sign-up")}
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              {isSignUp
                ? "Уже есть аккаунт? Войти"
                : "Нет аккаунта? Зарегистрироваться"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
