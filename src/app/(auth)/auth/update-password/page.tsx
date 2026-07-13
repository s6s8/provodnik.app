import type { Metadata } from "next";

import { UpdatePasswordScreen } from "@/features/auth/components/update-password-screen";

export const metadata: Metadata = {
  title: "Новый пароль",
};

export default function UpdatePasswordPage() {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-surface px-gutter py-16">
      <UpdatePasswordScreen />
    </section>
  );
}
