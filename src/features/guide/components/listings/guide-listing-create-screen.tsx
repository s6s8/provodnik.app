"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingForm } from "./listing-form";
import type { ListingInput } from "@/lib/supabase/listing-schema";
import {
  ListingPhotoUploadSection,
  type ListingUploadedPhoto,
} from "./listing-photo-upload-section";

type GuideListingCreateScreenProps = {
  onSubmit: (data: ListingInput) => Promise<string>;
  uploadActions: {
    getUploadUrl: (
      bucket: string,
      fileName: string,
      mimeType: string,
    ) => Promise<{ path: string; token: string; signedUrl: string }>;
    confirmUpload: (data: {
      listingId: string;
      objectPath: string;
      mimeType: string;
      byteSize: number;
    }) => Promise<ListingUploadedPhoto>;
  };
};

export function GuideListingCreateScreen({
  onSubmit,
  uploadActions,
}: GuideListingCreateScreenProps) {
  const router = useRouter();
  const [listingId, setListingId] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (data: ListingInput) => {
      const id = await onSubmit(data);
      setListingId(id);
      return id;
    },
    [onSubmit],
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/guide/listings">
          <ChevronLeft className="size-4" />
          Мои туры
        </Link>
      </Button>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Кабинет гида
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Новый тур
        </h1>
        <p className="text-sm text-muted-foreground">
          Заполните основные данные. После создания можно сразу добавить фото.
        </p>
      </div>

      {!listingId ? (
        <Card className="max-w-2xl border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Данные тура</CardTitle>
          </CardHeader>
          <CardContent>
            <ListingForm onSubmit={handleSubmit} submitLabel="Создать тур" />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Тур создан</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Теперь можно добавить фотографии. Первое изображение станет обложкой.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/guide/listings/${listingId}`)}
              >
                Перейти к туру
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/guide/listings/${listingId}/edit`)}
              >
                Открыть редактирование
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ListingPhotoUploadSection listingId={listingId} actions={uploadActions} />
    </div>
  );
}
