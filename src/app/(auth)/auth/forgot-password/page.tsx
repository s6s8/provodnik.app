import type { Metadata } from "next";

import { ForgotPasswordScreen } from "@/features/auth/components/forgot-password-screen";

export const metadata: Metadata = {
  title: "Сброс пароля",
};

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center px-[clamp(20px,4vw,48px)] py-12">
      <ForgotPasswordScreen />
    </section>
  );
}
