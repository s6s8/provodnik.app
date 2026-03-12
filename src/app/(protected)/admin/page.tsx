import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

const stats = [
  {
    title: "Moderation queues",
    description: "Guide approvals, listing review, and flagged content triage.",
    icon: "trust",
  },
  {
    title: "Dispute operations",
    description: "Cancellation, refund, and no-show case handling with audit trail.",
    icon: "commerce",
  },
  {
    title: "Marketplace control",
    description: "Ranking overrides, featured supply, and response-time oversight.",
    icon: "speed",
  },
  {
    title: "Launch readiness",
    description: "Release baseline is committed and isolated for parallel agent work.",
    icon: "readiness",
  },
] as const;

export default function AdminPage() {
  return (
    <DashboardOverview
      eyebrow="Admin workspace"
      title="Moderation and operations control surface"
      description="This route is the implementation target for marketplace operations: supply review, disputes, refund handling, and trust enforcement."
      stats={stats}
    />
  );
}
