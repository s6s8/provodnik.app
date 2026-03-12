import { GuideListingsManagerScreen } from "@/features/guide/components/listings/guide-listings-manager-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export default async function GuideListingsPage() {
  const auth = await readAuthContextFromServer();

  return <GuideListingsManagerScreen auth={auth} />;
}
