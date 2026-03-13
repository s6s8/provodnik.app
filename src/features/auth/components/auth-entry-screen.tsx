"use client";

import { useState } from "react";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const hasEnv = hasSupabaseEnv();

const roles = [
  { value: "traveler", label: "Путешественник" },
  { value: "guide", label: "Гид" },
  { value: "admin", label: "Оператор" },
] as const;

export function AuthEntryScreen() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("traveler");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    if (!trimmedEmail) {
      setError("Введите email, чтобы продолжить.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/traveler` : undefined;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
          data: { role },
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setSuccess(
        "Ссылка для входа отправлена. Откройте письмо, подтвердите вход и вернитесь в сервис.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить ссылку.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="glass-panel rounded-[2.2rem] border border-white/70">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Magic-link вход
        </p>
        <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
          Войти в Provodnik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email для входа
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
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              Роль в сервисе
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as (typeof roles)[number]["value"])
              }
              className="inline-flex h-12 w-full items-center justify-between rounded-2xl border border-input bg-white/82 px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-muted-foreground">
              Роль влияет на то, какой рабочий кабинет откроется после входа.
            </p>
          </div>

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
              {isSubmitting ? "Отправляем ссылку..." : "Получить ссылку для входа"}
            </Button>
            <p className="text-xs leading-6 text-muted-foreground">
              Авторизацию обрабатывает Supabase. После подтверждения вы вернетесь в
              сервис уже с активной сессией.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
