import type { Metadata } from "next";

import { GuideOnboardingScreen } from "@/features/guide/components/onboarding/guide-onboarding-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export const metadata: Metadata = {
  title: "Настройки профиля",
};

export default async function GuideSettingsPage() {
  const auth = await readAuthContextFromServer();

  return <GuideOnboardingScreen auth={auth} />;
}
