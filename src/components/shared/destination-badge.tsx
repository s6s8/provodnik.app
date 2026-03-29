export function DestinationBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--brand-light)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--brand)]">
      {name}
    </span>
  );
}
