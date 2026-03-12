import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

const stats = [
  {
    title: "Guide onboarding",
    description: "Profile, verification intake, attestation, and payout setup.",
    icon: "trust",
  },
  {
    title: "Supply creation",
    description: "Ready-made tour listings, seasonal availability, and pricing structure.",
    icon: "commerce",
  },
  {
    title: "Offer workflow",
    description: "Matched traveler requests, structured offers, and booking follow-through.",
    icon: "speed",
  },
  {
    title: "Operational baseline",
    description: "Performance metrics and notifications ready for implementation.",
    icon: "readiness",
  },
] as const;

export default function GuidePage() {
  return (
    <DashboardOverview
      eyebrow="Guide workspace"
      title="Supply-side foundation for listings and offers"
      description="This route is reserved for guide onboarding, listing management, offer handling, and booking operations."
      stats={stats}
    />
  );
}
