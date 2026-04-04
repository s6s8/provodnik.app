import Link from "next/link";

interface PageSectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}

export function PageSectionHeader({
  label,
  title,
  description,
  linkText,
  linkHref,
}: PageSectionHeaderProps) {
  return (
    <div className="bg-surface-low pb-12 pt-[100px] text-center">
      <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-on-surface-muted">
        {label}
      </p>

      <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1] text-on-surface">{title}</h1>

      {description ? (
        <p className="mx-auto mt-4 max-w-[760px] text-base leading-[1.65] text-on-surface-muted">
          {description}
        </p>
      ) : null}

      {linkText && linkHref ? (
        <div className="mt-6">
          <Link
            href={linkHref}
            className="inline-flex items-center rounded-full border border-primary/[0.22] px-[18px] py-[9px] font-sans text-sm font-medium text-primary transition-[background,border-color] duration-150"
          >
            {linkText}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
