import * as React from "react";

type ImageShimProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | { src?: string };
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number | string;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
};

/** Design-sync shim for next/image — renders a plain <img>, stripping Next-only props. */
export default function Image({
  src,
  alt = "",
  fill,
  priority,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  loader,
  unoptimized,
  onLoadingComplete,
  style,
  ...rest
}: ImageShimProps) {
  const url = typeof src === "string" ? src : src?.src ?? "";
  const merged = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...(style || {}) }
    : style;
  return React.createElement("img", { src: url, alt, style: merged, ...rest });
}
