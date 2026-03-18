import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  right?: ReactNode;
};

export function MarketplaceResultsHeader({ label, value, right }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </h2>
      </div>
      {right}
    </div>
  );
}

