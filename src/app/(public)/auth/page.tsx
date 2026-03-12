import { SiteHeader } from "@/components/shared/site-header";
import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
        <section className="max-w-xl space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to the workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Use your email to receive a magic link. Roles are mapped to Supabase{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                profiles.role
              </code>{" "}
              for protected traveler, guide, and admin routes.
            </p>
          </div>

          <AuthEntryScreen />

          <p className="text-xs text-muted-foreground">
            For local exploration without Supabase, you can still use the demo session
            controls in the workspace header after navigating to any protected route.
          </p>
        </section>
      </main>
    </div>
  );
}

