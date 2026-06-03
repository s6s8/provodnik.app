import type { ReactNode } from "react";

import {
  GuideProfileSectionClientBoundary,
  GuideProfileSectionFallback,
} from "./guide-profile-section-client-boundary";

type GuideProfileSectionBoundaryProps = {
  id: string;
  title: string;
  children: () => ReactNode;
};

export function GuideProfileSectionBoundary({
  id,
  title,
  children,
}: GuideProfileSectionBoundaryProps) {
  let content: ReactNode;

  try {
    content = children();
  } catch (error) {
    console.error(`[GuideProfileSectionBoundary] ${id} failed:`, error);
    content = <GuideProfileSectionFallback title={title} />;
  }

  return (
    <section id={id} className="scroll-mt-[calc(var(--nav-h)+1rem)]">
      <GuideProfileSectionClientBoundary key={id} sectionId={id} title={title}>
        {content}
      </GuideProfileSectionClientBoundary>
    </section>
  );
}
