"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const hasEnv = hasSupabaseEnv();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    if (password.length < 6) {
      setError("Пароль слишком короткий. Используйте не менее 6 символов.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают. Проверьте ввод и попробуйте снова.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(getFriendlyAuthError(updateError.message));
        return;
      }

      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? getFriendlyAuthError(submitError.message)
          : "Не удалось изменить пароль. Попробуйте еще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-[min(100%,30rem)] rounded-glass border border-glass-border bg-glass p-[clamp(1.75rem,4vw,2.5rem)] shadow-glass backdrop-blur-[20px]">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Новый пароль
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Введите новый пароль для вашего аккаунта.
        </p>
      </div>

      {!hasEnv ? (
        <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            В этой среде обновление пароля пока недоступно. Проверьте значения{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> в{" "}
            <code>.env.local</code>.
          </p>
        </div>
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
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Минимум 6 символов"
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
              type="password"
              autoComplete="new-password"
              placeholder="Введите пароль еще раз"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 shadow-none focus-visible:border-ring"
            />
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-2 rounded-[1.4rem] border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>Пароль изменён. Выполняем вход...</p>
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-full"
          disabled={isSubmitting || success || !hasEnv}
        >
          {isSubmitting ? "Сохранить пароль..." : "Сохранить пароль"}
        </Button>
      </form>
    </div>
  );
}
