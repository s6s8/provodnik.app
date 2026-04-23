import { redirect } from "next/navigation";

export default function GuideOrdersPage() {
  redirect("/guide?tab=bookings");
}
