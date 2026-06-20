import type { ReactNode } from "react";

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-[96px] pb-16 bg-surface">
      <div className="mx-auto w-full max-w-[760px] px-[clamp(28px,5vw,56px)]">
        {children}
      </div>
    </div>
  );
}
