"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadFileToSignedUrl } from "@/lib/storage/client-upload";
import {
  confirmAvatarUploadAction,
  requestAvatarUploadUrlAction,
} from "@/app/(protected)/profile/avatar-action";

const MAX_BYTES = 2 * 1024 * 1024;
const MIME_ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIZE_ERROR = "Файл больше 2 МБ — выбери поменьше";
const MIME_ERROR = "Поддерживаются только JPG, PNG, WEBP";

interface AvatarUploadBlockProps {
  avatarUrl: string | null;
  displayName: string;
}

export function AvatarUploadBlock({ avatarUrl, displayName }: AvatarUploadBlockProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const buttonLabel = avatarUrl ? "Изменить аватар" : "Загрузить аватар";

  function handleClick() {
    setError(null);
    setSuccess(null);
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-uploading same file later
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError(SIZE_ERROR);
      return;
    }
    if (!MIME_ALLOWED.has(file.type)) {
      setError(MIME_ERROR);
      return;
    }

    startTransition(async () => {
      try {
        const uploadUrl = await requestAvatarUploadUrlAction({
          mimeType: file.type,
          byteSize: file.size,
        });
        if (!uploadUrl.ok) {
          setError(uploadUrl.message);
          return;
        }

        await uploadFileToSignedUrl({
          signedUrl: uploadUrl.signedUrl,
          file,
        });

        const result = await confirmAvatarUploadAction({
          objectPath: uploadUrl.objectPath,
          mimeType: file.type,
          byteSize: file.size,
        });
        if (result.ok) {
          setSuccess(result.message);
          router.refresh();
        } else {
          setError(result.message);
        }
      } catch (_err) {
        setError("Не удалось загрузить — попробуй ещё раз");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={handleClick}
            disabled={pending}
          >
            {pending ? "Загрузка…" : buttonLabel}
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
