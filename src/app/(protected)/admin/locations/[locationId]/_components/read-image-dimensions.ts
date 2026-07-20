/**
 * Pixel dimensions of a picked image, or null when the browser cannot decode it.
 * Null is not an error: the record stores dimensions as optional metadata and the
 * server still validates type and size.
 */
export async function readImageDimensions(
  file: Blob,
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close?.();
    return width > 0 && height > 0 ? { width, height } : null;
  } catch {
    return null;
  }
}
