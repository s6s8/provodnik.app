import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

const stats = [
  {
    title: "Request creation",
    description: "Structured demand capture by region, dates, budget, and group size.",
    icon: "speed",
  },
  {
    title: "Group mechanics",
    description: "Joinable requests for budget-sensitive travelers who want shared pricing.",
    icon: "commerce",
  },
  {
    title: "Booking trust",
    description: "Offers, deposits, status timeline, and review-driven post-booking confidence.",
    icon: "trust",
  },
  {
    title: "Account foundation",
    description: "Favorites, bookings, and traveler profile routes are scaffolded for the MVP.",
    icon: "readiness",
  },
] as const;

export default function TravelerPage() {
  return (
    <DashboardOverview
      eyebrow="Traveler workspace"
      title="Demand-side flow for requests, joining, and booking"
      description="This route is the implementation target for travelers: browsing, request creation, group joining, and booking management."
      stats={stats}
    />
  );
}
