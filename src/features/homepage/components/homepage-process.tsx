import { Fragment } from "react";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Search,
  Users,
  Waypoints,
} from "lucide-react";

import {
  type HomeProcessStep,
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

const stepIcons = {
  search: Search,
  users: Users,
  banknote: Banknote,
  waypoints: Waypoints,
  check: CheckCircle2,
} as const;

export function HomePageProcess() {
  const steps = homepageContent.process.steps;

  return (
    <section id="process" className={cn(homeContainerClass, "pb-6 pt-2 sm:pb-8")}>
      <div className="rounded-[24px] border border-[rgba(226,232,240,0.65)] bg-[rgba(255,255,255,0.35)] px-4 py-6 shadow-[0_14px_40px_rgba(33,49,63,0.04)] backdrop-blur-md backdrop-saturate-150 sm:px-6 sm:py-7">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-text)] sm:text-[1.875rem]">
          {homepageContent.process.title}
        </h2>

        <div className="mt-6 lg:hidden">
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-start gap-4 pr-2">
              {steps.map((step, index) => (
                <Fragment key={step.title}>
                  <ProcessStep step={step} index={index} />
                  {index < steps.length - 1 ? (
                    <ArrowRight className="mt-6 size-4 shrink-0 text-[rgba(203,213,225,0.95)]" strokeWidth={1.5} />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 hidden items-start gap-1 lg:flex">
          {steps.map((step, index) => (
            <Fragment key={step.title}>
              <ProcessStep step={step} index={index} wide />
              {index < steps.length - 1 ? (
                <ArrowRight
                  className="mx-0.5 mt-7 size-[1rem] shrink-0 text-[rgba(203,213,225,0.95)]"
                  strokeWidth={1.5}
                />
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessStep({
  step,
  index,
  wide = false,
}: {
  step: HomeProcessStep;
  index: number;
  wide?: boolean;
}) {
  const Icon = stepIcons[step.icon];

  return (
    <article
      className={cn(
        "flex flex-col gap-2",
        wide ? "min-w-0 flex-1" : "w-[148px]",
      )}
    >
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <span className="font-display text-[1.65rem] font-bold leading-none tabular-nums">
          {index + 1}.
        </span>
        <Icon className="size-[18px] shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} />
      </div>
      <p
        className={cn(
          "text-[0.8125rem] font-semibold leading-snug text-[var(--color-text)]",
          wide ? "max-w-[9.5rem]" : "max-w-[9rem]",
        )}
      >
        {step.title}
      </p>
    </article>
  );
}
