"use client";

import { useRef, useState } from "react";

import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasSupabaseEnv } from "@/lib/env";
import { sendPasswordResetEmail } from "@/app/(auth)/auth/forgot-password/actions";

const hasEnv = hasSupabaseEnv();
const FORGOT_ERROR_ID = "forgot-password-error";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  function fail(message: string) {
    setError(message);
    emailRef.current?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      fail("Введите email, чтобы получить ссылку для сброса пароля.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendPasswordResetEmail(trimmedEmail);

      if (!result.ok) {
        fail(result.error);
        return;
      }

      setSuccess(true);
    } catch {
      fail("Не удалось отправить письмо. Попробуйте еще раз.");
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
            Забыли пароль?
          </h1>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Введите email — мы пришлём ссылку для создания нового пароля.
          </p>
        </div>
      </div>

      {!hasEnv ? (
        <Alert variant="info" className="mt-8 rounded-xl">
          <AlertCircle />
          <AlertDescription>
            Восстановление пароля временно недоступно. Напишите в поддержку.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 space-y-5">
        {error ? (
          <Alert
            id={FORGOT_ERROR_ID}
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
            <AlertDescription>
              Письмо отправлено. Проверьте почту и перейдите по ссылке для
              сброса пароля.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? FORGOT_ERROR_ID : undefined}
                  className="min-h-13 w-full rounded-xl border border-input bg-surface-high/[0.78] pl-11 shadow-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-btn"
              disabled={isSubmitting || !hasEnv}
            >
              {isSubmitting ? "Отправить ссылку..." : "Отправить ссылку"}
            </Button>
          </form>
        )}
      </div>
    </GlassCard>
  );
}
