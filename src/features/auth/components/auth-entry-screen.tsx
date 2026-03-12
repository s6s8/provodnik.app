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
  { value: "traveler", label: "Traveler" },
  { value: "guide", label: "Guide" },
  { value: "admin", label: "Admin (operators only)" },
] as const;

export function AuthEntryScreen() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("traveler");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!hasEnv) {
    return (
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="size-4 text-amber-500" />
            Supabase auth not configured
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This environment does not have Supabase keys configured. The protected
            workspace can still be explored using the local demo session controls in
            the workspace header.
          </p>
          <p>
            To enable real auth, set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>.
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
      setError("Enter an email to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/traveler`
          : undefined;

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
        "Check your email for a sign-in link. After confirmation, you will be redirected into the workspace.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error during sign-in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="text-base">Sign in to Provodnik</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="email"
                className="text-xs font-medium text-muted-foreground"
              >
                Work email
              </label>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="role"
                className="text-xs font-medium text-muted-foreground"
              >
                Workspace role
              </label>
            </div>
            <select
              id="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as (typeof roles)[number]["value"])
              }
              className="inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              This seeds your app role for the MVP baseline. Operator/admin access
              should only be used for internal review.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4" />
              <p>{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="mt-0.5 size-4" />
              <p>{success}</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Magic-link auth is handled by Supabase. You can keep another tab open in
              the workspace while confirming.
            </p>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Sending link..." : "Send sign-in link"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

