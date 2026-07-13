import type { Metadata } from "next";

import { ForgotPasswordScreen } from "@/features/auth/components/forgot-password-screen";

export const metadata: Metadata = {
  title: "Сброс пароля",
};

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-surface px-gutter py-16">
      <ForgotPasswordScreen />
    </section>
  );
}
