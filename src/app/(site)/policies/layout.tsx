import type { ReactNode } from "react";

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="py-16 bg-surface">
      <div className="mx-auto w-full max-w-3xl px-gutter">
        {children}
      </div>
    </div>
  );
}
