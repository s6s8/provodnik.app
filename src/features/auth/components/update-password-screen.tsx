"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const hasEnv = hasSupabaseEnv();
const UPDATE_ERROR_ID = "update-password-error";

type ErrorField = "password" | "confirm-password";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password must be at least")
  ) {
    return "Пароль слишком короткий. Используйте не менее 6 символов.";
  }

  if (normalized.includes("auth session missing")) {
    return "Ссылка для сброса недействительна или устарела. Запросите новую.";
  }

  return message;
}

export function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField | null>(null);
  const [success, setSuccess] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  function fail(message: string, field?: ErrorField) {
    setError(message);
    setErrorField(field ?? null);
    if (field === "password") {
      passwordRef.current?.focus();
    } else if (field === "confirm-password") {
      confirmPasswordRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/auth");
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, success]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorField(null);

    if (password.length < 6) {
      fail("Пароль слишком короткий. Используйте не менее 6 символов.", "password");
      return;
    }

    if (password !== confirmPassword) {
      fail(
        "Пароли не совпадают. Проверьте ввод и попробуйте снова.",
        "confirm-password",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        fail(getFriendlyAuthError(updateError.message), "password");
        return;
      }

      setSuccess(true);
    } catch (submitError) {
      fail(
        submitError instanceof Error
          ? getFriendlyAuthError(submitError.message)
          : "Не удалось изменить пароль. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GlassCard className="w-[min(100%,30rem)] p-[clamp(1.75rem,4vw,2.5rem)]">
      <div className="space-y-3">
        <Link
          href="/auth"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Назад ко входу</span>
        </Link>
        <Badge variant="eyebrow" asChild>
          <Link href="/">Проводник</Link>
        </Badge>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Новый пароль
          </h1>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Введите новый пароль для вашего аккаунта.
          </p>
        </div>
      </div>

      {!hasEnv ? (
        <Alert variant="info" className="mt-8 rounded-xl">
          <AlertCircle />
          <AlertDescription>
            Обновление пароля временно недоступно. Напишите в поддержку.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-2.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Новый пароль
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errorField === "password" || undefined}
              aria-describedby={
                errorField === "password" ? UPDATE_ERROR_ID : undefined
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

        <div className="grid gap-2.5">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-foreground"
          >
            Повторите пароль
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              ref={confirmPasswordRef}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Введите пароль еще раз"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={errorField === "confirm-password" || undefined}
              aria-describedby={
                errorField === "confirm-password" ? UPDATE_ERROR_ID : undefined
              }
              className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 pr-14 shadow-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-1.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              aria-label={
                showConfirmPassword ? "Скрыть пароль" : "Показать пароль"
              }
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <Alert
            id={UPDATE_ERROR_ID}
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
            <AlertDescription>Пароль изменён. Выполняем вход...</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-btn"
          disabled={isSubmitting || success || !hasEnv}
        >
          {isSubmitting ? "Сохранить пароль..." : "Сохранить пароль"}
        </Button>
      </form>
    </GlassCard>
  );
}
