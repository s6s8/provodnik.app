import Link from "next/link";

const referencePages = [
  {
    href: "/reference/home-concepts/page2",
    title: "Concept page2",
    description: "The earlier modular homepage variant with catalog-led sections.",
  },
  {
    href: "/reference/home-concepts/page3",
    title: "Concept page3",
    description: "The previous homepage moved out of the main route for archive purposes.",
  },
] as const;

export default function ReferenceIndexPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
          Archive overview
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Reference-only homepage explorations
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
          These routes are preserved for design context and future comparison. The current source of
          truth for the live homepage is now `/` inside the dedicated home route group.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {referencePages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-[1.5rem] border border-white/12 bg-white/6 p-6 transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <p className="text-lg font-semibold text-white">{page.title}</p>
            <p className="mt-3 text-sm leading-7 text-white/62">{page.description}</p>
            <p className="mt-4 text-sm font-medium text-white/88">Open {page.href}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
