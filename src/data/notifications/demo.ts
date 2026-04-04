import type { DemoRole } from "@/lib/demo-session";

export function getDemoUserIdForRole(role: DemoRole): string {
  if (role === "traveler") return "usr_traveler_you";
  if (role === "guide") return "usr_guide_you";
  return "usr_admin_you";
}

