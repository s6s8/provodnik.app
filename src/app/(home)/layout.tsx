import type { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0f0f0f] text-white">{children}</div>;
}
