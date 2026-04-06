"use client";

import { usePathname } from "next/navigation";

import { BreadcrumbsNav } from "./breadcrumbs";

export function BreadcrumbsClient() {
  const pathname = usePathname();

  return <BreadcrumbsNav pathname={pathname ?? "/"} />;
}
