import { GuideOnboardingScreen } from "@/features/guide/components/onboarding/guide-onboarding-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function GuidePage() {
  const auth = await readAuthContextFromServer();

  return <GuideOnboardingScreen auth={auth} />;
}
