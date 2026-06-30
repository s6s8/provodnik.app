import * as React from "react";

type LinkShimProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href?: string | { pathname?: string };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
};

/** Design-sync shim for next/link — renders a plain <a>, stripping Next-only props. */
export default function Link({
  href,
  children,
  prefetch,
  replace,
  scroll,
  shallow,
  passHref,
  legacyBehavior,
  ...rest
}: LinkShimProps) {
  const url = typeof href === "string" ? href : href?.pathname ?? "#";
  return React.createElement("a", { href: url, ...rest }, children);
}
