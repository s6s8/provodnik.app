import type { Metadata } from "next";

import { UpdatePasswordScreen } from "@/features/auth/components/update-password-screen";

export const metadata: Metadata = {
  title: "Новый пароль",
};

export default function UpdatePasswordPage() {
  return (
    <section className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center px-[clamp(20px,4vw,48px)] py-12">
      <UpdatePasswordScreen />
    </section>
  );
}
