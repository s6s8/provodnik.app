"use client";

import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/features/auth/actions/signUpAction";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface HomepageAuthGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void | Promise<void>;
}

function getFriendlyAuthError(code: string): string {
  switch (code) {
    case "already_registered":
      return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
    case "internal":
      return "Что-то пошло не так. Попробуйте ещё раз.";
  }
  const normalized = code.toLowerCase();
  if (normalized.includes("invalid login credentials"))
    return "Неверный email или пароль.";
  if (normalized.includes("user already registered"))
    return "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.";
  if (normalized.includes("email not confirmed"))
    return "Подтвердите email по письму и попробуйте снова.";
  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password must be at least")
  )
    return "Пароль слишком короткий. Используйте не менее 6 символов.";
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

export function HomepageAuthGate({
  open,
  onOpenChange,
  onAuthSuccess,
}: HomepageAuthGateProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    setError(null);

    try {
      if (mode === "sign-in") {
        const supabase = createSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setError(getFriendlyAuthError(signInError.message));
          return;
        }

        await onAuthSuccess();
        return;
      }

      const result = await signUpAction({
        email: trimmedEmail,
        password,
        role: "traveler",
        fullName: trimmedFullName,
        phone: phone.trim() || undefined,
      });

      if (!result.ok) {
        setError(getFriendlyAuthError(result.error));
        return;
      }

      await onAuthSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "sign-in" ? "Войти" : "Создать профиль"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
          {mode === "sign-up" ? (
            <>
              <div className="grid gap-1.5">
                <label
                  htmlFor="hag-full-name"
                  className="text-sm font-medium text-foreground"
                >
                  Как к вам обращаться
                </label>
                <Input
                  id="hag-full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Например, Анна Смирнова"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="hag-phone"
                  className="text-sm font-medium text-foreground"
                >
                  Телефон (необязательно)
                </label>
                <Input
                  id="hag-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 900 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          ) : null}

          <div className="grid gap-1.5">
            <label
              htmlFor="hag-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="hag-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="hag-password"
              className="text-sm font-medium text-foreground"
            >
              {mode === "sign-up" ? "Создайте пароль" : "Пароль"}
            </label>
            <div className="relative">
              <Input
                id="hag-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                placeholder={
                  mode === "sign-up" ? "Минимум 6 символов" : "Введите пароль"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "sign-in"
                ? "Войти..."
                : "Создать профиль..."
              : mode === "sign-in"
                ? "Войти"
                : "Создать профиль"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
            setError(null);
          }}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "sign-in"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
