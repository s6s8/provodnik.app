export function uploadFileToSignedUrl(input: {
  signedUrl: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const { signedUrl, file, onProgress } = input;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("cacheControl", "3600");
    formData.append("", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Не удалось загрузить файл в хранилище."));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error("Хранилище вернуло ошибку при загрузке файла."));
    });

    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.send(formData);
  });
}
