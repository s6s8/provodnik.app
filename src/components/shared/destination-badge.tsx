export function DestinationBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-light px-4 py-2 text-xs font-semibold tracking-[0.08em] text-brand">
      {name}
    </span>
  );
}
