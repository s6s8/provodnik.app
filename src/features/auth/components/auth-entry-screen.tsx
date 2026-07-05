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
import { DEFAULT_GUIDE_TYPE, GUIDE_TYPES, type GuideType } from "@/features/auth/guide-type";
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
    case "phone_taken":
      return "Этот телефон уже привязан к другому аккаунту. Войдите в существующий аккаунт или укажите другой номер.";
    case "phone_required":
      return "Укажите телефон — он нужен для связи с путешественниками и проверки профиля.";
    case "guide_type_required":
      return "Выберите формат работы: индивидуальный гид, агентство или команда гидов.";
    case "invalid_input":
      return "Проверьте введённые данные: email, пароль (минимум 8 символов) и имя.";
    case "rate_limited":
      return "Слишком много попыток регистрации. Подождите немного и попробуйте снова.";
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
  const [guideType, setGuideType] = useState<GuideType>(DEFAULT_GUIDE_TYPE);
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
    if (mode === "sign-up" && role === "guide" && !phone.replace(/\D/g, "")) {
      setError("Укажите телефон — он нужен для связи с путешественниками и проверки профиля.");
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
        guideType: role === "guide" ? guideType : undefined,
      });

      if (!result.ok) {
        setError(getFriendlyAuthError(result.error));
        return;
      }

      window.location.assign(result.dashboardPath ?? resolvePostAuthRedirectPath(role, next));
    } catch {
      setError("Не удалось выполнить авторизацию. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const ctaLabel = isSignUp ? "Создать профиль" : "Войти";
  const togglePrompt = isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?";
  const toggleAction = isSignUp ? "Войти" : "Создать профиль";

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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignUp ? "Создание профиля" : "Вход"}
            </h1>
          </div>
        </div>
      </div>

      <div>
        {!hasSupabaseEnv() ? (
          <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Вход временно недоступен. Напишите в поддержку.
            </p>
          </div>
        ) : null}

        {errorCode === "missing-role" ? (
          <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Не удалось определить роль аккаунта. Выйдите и войдите снова или
              напишите в поддержку.
            </p>
          </div>
        ) : null}

        {errorCode === "admin-access-denied" ? (
          <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
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
                  {role === "guide" ? "Телефон для проверки" : "Телефон (необязательно)"}
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
                {role === "guide" ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Нужен для связи и ручной проверки. Путешественникам он не показывается без вашего решения.
                  </p>
                ) : null}
              </div>
              {role === "guide" ? (
                <div className="grid gap-2.5">
                  <p className="text-sm font-medium text-foreground">Кто будет проводить экскурсии</p>
                  <div className="grid gap-2">
                    {GUIDE_TYPES.map((type) => (
                      <label
                        key={type.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[1.2rem] border border-input bg-surface-high/[0.78] px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="guide-type"
                          value={type.id}
                          checked={guideType === type.id}
                          onChange={() => setGuideType(type.id)}
                          className="size-4 accent-primary"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
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
                aria-invalid={error ? true : undefined}
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
                placeholder={isSignUp ? "Минимум 8 символов" : "Введите пароль"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error ? true : undefined}
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

          {error ? (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2 rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
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
            disabled={isSubmitting || !hasSupabaseEnv() || !hydrated}
          >
            {isSubmitting ? `${ctaLabel}...` : ctaLabel}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{togglePrompt}</span>
          <button
            type="button"
            onClick={() => handleModeChange(isSignUp ? "sign-in" : "sign-up")}
            className="font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            {toggleAction}
          </button>
        </div>
      </div>
    </div>
  );
}
