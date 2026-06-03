import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function parseSignedUploadUrl(signedUrl: string): { bucket: string; path: string; token: string } {
  const url = new URL(signedUrl);
  const match = url.pathname.match(/\/object\/upload\/sign\/([^/]+)\/(.+)$/);
  const token = url.searchParams.get("token");

  if (!match || !token) {
    throw new Error("Не удалось подготовить ссылку для загрузки файла.");
  }

  return {
    bucket: decodeURIComponent(match[1]),
    path: decodeURIComponent(match[2]),
    token,
  };
}

export function uploadFileToSignedUrl(input: {
  signedUrl: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const { signedUrl, file, onProgress } = input;
  const { bucket, path, token } = parseSignedUploadUrl(signedUrl);

  return createSupabaseBrowserClient()
    .storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      cacheControl: "3600",
      upsert: false,
    })
    .then(({ error }) => {
      if (error) {
        throw new Error("Хранилище вернуло ошибку при загрузке файла.");
      }

      onProgress?.(100);
    });
}
