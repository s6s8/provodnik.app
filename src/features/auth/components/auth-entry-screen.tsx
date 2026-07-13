"use client";

import { useRef, useState, useSyncExternalStore } from "react";

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

import { GlassCard } from "@/components/shared/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_GUIDE_TYPE, GUIDE_TYPES, type GuideType } from "@/features/auth/guide-type";
import { resolveCanonicalRole } from "@/lib/auth/role-routing";
import {
  isAdminWorkspacePath,
  resolvePostAuthRedirectPath,
  resolveSafeNextPath,
} from "@/lib/auth/safe-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signUpAction } from "@/features/auth/actions/signUpAction";

type AuthFormMode = "sign-in" | "sign-up";
type ErrorField = "full-name" | "phone" | "email" | "password";

const AUTH_ERROR_ID = "auth-form-error";

// Which input a sign-up error code belongs to; unmapped codes are not field errors.
const SIGN_UP_ERROR_FIELDS: Record<string, ErrorField> = {
  already_registered: "email",
  phone_taken: "phone",
  phone_required: "phone",
  invalid_input: "email",
};

function resolveSignInErrorField(message: string): ErrorField | undefined {
  const normalized = message.toLowerCase();
  if (normalized.includes("password")) {
    return "password";
  }
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email")
  ) {
    return "email";
  }
  return undefined;
}

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
      return "Проверьте введённые данные: email, пароль (минимум 6 символов) и имя.";
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
  const [errorField, setErrorField] = useState<ErrorField | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const fieldRefs: Record<
    ErrorField,
    React.RefObject<HTMLInputElement | null>
  > = {
    "full-name": fullNameRef,
    phone: phoneRef,
    email: emailRef,
    password: passwordRef,
  };

  function fail(message: string, field?: ErrorField) {
    setError(message);
    setErrorField(field ?? null);
    if (field) {
      fieldRefs[field].current?.focus();
    }
  }

  function handleModeChange(nextMode: AuthFormMode) {
    setMode(nextMode);
    setError(null);
    setErrorField(null);
    setSuccess(null);
    setShowPassword(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorField(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedEmail) {
      fail("Введите email, чтобы продолжить.", "email");
      return;
    }
    if (!password) {
      fail("Введите пароль, чтобы продолжить.", "password");
      return;
    }
    if (mode === "sign-up" && !trimmedFullName) {
      fail("Укажите имя, которое нужно сохранить в профиле.", "full-name");
      return;
    }
    if (mode === "sign-up" && role === "guide" && !phone.replace(/\D/g, "")) {
      fail(
        "Укажите телефон — он нужен для связи с путешественниками и проверки профиля.",
        "phone",
      );
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
          fail(
            getFriendlyAuthError(signInError.message),
            resolveSignInErrorField(signInError.message),
          );
          return;
        }

        const signedInUser = signInData.user;
        if (!signedInUser) {
          fail("Не удалось получить данные сессии. Попробуйте ещё раз.");
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
          fail(
            "Не удалось проверить права администратора после входа. Попробуйте ещё раз или напишите в поддержку.",
          );
          return;
        }

        if (!userRole) {
          fail(
            profileError
              ? "Не удалось загрузить профиль после входа. Попробуйте ещё раз или напишите в поддержку."
              : "Не удалось определить роль аккаунта. Выйдите и войдите снова или напишите в поддержку.",
          );
          return;
        }

        if (next && isAdminWorkspacePath(next) && userRole !== "admin") {
          fail(
            "У этого аккаунта нет прав администратора. Войдите под админским email или обратитесь к владельцу доступа.",
          );
          return;
        }

        const destination = resolvePostAuthRedirectPath(userRole, next);

        if (!destination) {
          fail(
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
        fail(
          getFriendlyAuthError(result.error),
          SIGN_UP_ERROR_FIELDS[result.error],
        );
        return;
      }

      // New guides must land on the verification anketa (server-chosen
      // dashboardPath), not the role dashboard; a safe, role-accessible
      // ?next= still wins, but a rejected one must not degrade to /guide.
      window.location.assign(
        resolveSafeNextPath(role, next) ?? result.dashboardPath,
      );
    } catch {
      fail("Не удалось выполнить авторизацию. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const ctaLabel = isSignUp ? "Создать профиль" : "Войти";
  const togglePrompt = isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?";
  const toggleAction = isSignUp ? "Войти" : "Создать профиль";

  return (
    <GlassCard className="w-[min(100%,30rem)] p-[clamp(1.75rem,4vw,2.5rem)]">
      <div className="flex flex-col gap-3">
        <Badge variant="eyebrow" asChild>
          <Link href="/">Проводник</Link>
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isSignUp ? "Создание профиля" : "Вход"}
        </h1>
      </div>

      <div>
        {!hasSupabaseEnv() ? (
          <Alert variant="info" className="mt-8 rounded-xl">
            <AlertCircle />
            <AlertDescription>
              Вход временно недоступен. Напишите в поддержку.
            </AlertDescription>
          </Alert>
        ) : null}

        {errorCode === "missing-role" ? (
          <Alert variant="destructive" className="mt-8 rounded-xl">
            <AlertCircle />
            <AlertDescription>
              Не удалось определить роль аккаунта. Выйдите и войдите снова или
              напишите в поддержку.
            </AlertDescription>
          </Alert>
        ) : null}

        {errorCode === "admin-access-denied" ? (
          <Alert variant="destructive" className="mt-8 rounded-xl">
            <AlertCircle />
            <AlertDescription>
              Для входа в админку нужен аккаунт с ролью администратора. Войдите
              под админским email или сначала выйдите из текущего аккаунта.
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
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
                    ref={fullNameRef}
                    type="text"
                    autoComplete="name"
                    placeholder="Например, Анна Смирнова"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    aria-invalid={errorField === "full-name" || undefined}
                    aria-describedby={
                      errorField === "full-name" ? AUTH_ERROR_ID : undefined
                    }
                    className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 shadow-none"
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
                    ref={phoneRef}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 900 123-45-67"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={errorField === "phone" || undefined}
                    aria-describedby={
                      errorField === "phone" ? AUTH_ERROR_ID : undefined
                    }
                    className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 shadow-none"
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
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-surface-high/[0.78] px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
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
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="ваш@email.ru"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={errorField === "email" || undefined}
                aria-describedby={
                  errorField === "email" ? AUTH_ERROR_ID : undefined
                }
                className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 shadow-none"
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
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Минимум 6 символов" : "Введите пароль"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={errorField === "password" || undefined}
                aria-describedby={
                  errorField === "password" ? AUTH_ERROR_ID : undefined
                }
                className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 pr-14 shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-1.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
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
            <Alert
              id={AUTH_ERROR_ID}
              role="alert"
              variant="destructive"
              className="rounded-xl"
            >
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert variant="success" className="rounded-xl">
              <CheckCircle2 />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full rounded-btn"
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
    </GlassCard>
  );
}
