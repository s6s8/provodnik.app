type Props = {
  label: string;
  value: string;
};

export function MarketplaceInfoTile({ label, value }: Props) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

