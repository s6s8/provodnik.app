"use client";

import { useState } from "react";

import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { sendPasswordResetEmail } from "@/app/(auth)/auth/forgot-password/actions";

const hasEnv = hasSupabaseAdminEnv();

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Введите email, чтобы получить ссылку для сброса пароля.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendPasswordResetEmail(trimmedEmail);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Не удалось отправить письмо. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-[min(100%,30rem)] rounded-glass border border-glass-border bg-glass p-[clamp(1.75rem,4vw,2.5rem)] shadow-glass backdrop-blur-[20px]">
      <div className="space-y-3">
        <Link
          href="/auth"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Назад ко входу</span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Восстановление доступа
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Забыли пароль?
          </h1>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Введите email — мы пришлём ссылку для создания нового пароля.
          </p>
        </div>
      </div>

      {!hasEnv ? (
        <div className="mt-8 flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            В этой среде восстановление пароля пока недоступно. Проверьте
            значения <code>NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> в{" "}
            <code>.env.local</code>.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {error ? (
          <div className="flex items-start gap-2 rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-start gap-2 rounded-[1.4rem] border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Письмо отправлено. Проверьте почту и перейдите по ссылке для
              сброса пароля.
            </p>
          </div>
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
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-[3.25rem] w-full rounded-[1.2rem] border border-input bg-surface-high/[0.78] pl-11 shadow-none focus-visible:border-ring"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full"
              disabled={isSubmitting || !hasEnv}
            >
              {isSubmitting ? "Отправить ссылку..." : "Отправить ссылку"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
