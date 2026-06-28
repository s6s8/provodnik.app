/** Design-sync shim for next/navigation — static stubs so client components render in isolation. */
const noop = () => {};

export function usePathname(): string {
  return "/";
}

export function useRouter() {
  return { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop };
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useParams(): Record<string, string> {
  return {};
}

export function useSelectedLayoutSegment(): string | null {
  return null;
}

export function useSelectedLayoutSegments(): string[] {
  return [];
}

export function redirect(): never {
  throw new Error("redirect (shim)");
}

export function notFound(): never {
  throw new Error("notFound (shim)");
}
