import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {kicker ? <p className="editorial-kicker">{kicker}</p> : null}
      <h2 className="mt-2 text-[clamp(2rem,3.5vw,2.5rem)] font-semibold leading-[1.15] text-[var(--ink)]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-2)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
