import type { ReactNode } from "react";
import Link from "next/link";

const conceptLinks = [
  { href: "/reference/home-concepts/page2", label: "Home concept /page2" },
  { href: "/reference/home-concepts/page3", label: "Home concept /page3" },
] as const;

export default function ReferenceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Reference archive
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Historical homepage concepts and supporting layouts
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/82 transition hover:bg-white/12 hover:text-white"
            >
              Back to current homepage
            </Link>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Reference navigation">
            {conceptLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/72 transition hover:bg-white/12 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
