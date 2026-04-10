import type { ReactNode } from "react";

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-[110px] pb-20 bg-surface">
      <div className="mx-auto w-full max-w-[860px] px-[clamp(20px,4vw,48px)]">
        {children}
      </div>
    </div>
  );
}
