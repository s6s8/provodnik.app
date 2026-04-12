"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingPhotoRow, ListingRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SectionProps } from "./BasicsSection";

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

export function PhotosSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const [photos, setPhotos] = useState<ListingPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const supabase = getLooseClient();
    const { data, error } = await supabase
      .from("listing_photos")
      .select("id, listing_id, url, position, alt_text")
      .eq("listing_id", listing.id)
      .order("position", { ascending: true });
    if (!error && data) {
      setPhotos(data as ListingPhotoRow[]);
    }
    setLoading(false);
  }, [listing.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    const cover = photos.find((p) => p.position === 0)?.url ?? null;
    const d = draft as Partial<ListingRow> & { image_url?: string | null };
    const current =
      "image_url" in d
        ? (d.image_url ?? null)
        : ((listing as ListingRow & { image_url?: string | null }).image_url ??
          null);
    if (cover === current) return;
    onChange({ image_url: cover } as Partial<ListingRow>);
  }, [photos, listing, draft, onChange]);

  const addPhoto = async () => {
    const url = newUrl.trim();
    if (!url) return;
    const supabase = getLooseClient();
    const { error } = await supabase.from("listing_photos").insert({
      listing_id: listing.id,
      url,
      alt_text: newAlt.trim() || null,
      position: photos.length,
    });
    if (!error) {
      setNewUrl("");
      setNewAlt("");
      void fetchPhotos();
    }
  };

  const deletePhoto = async (photo: ListingPhotoRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_photos")
      .delete()
      .eq("id", photo.id);
    if (!error) void fetchPhotos();
  };

  if (loading) {
    return (
      <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-glass" />
        <Skeleton className="h-48 w-full rounded-glass" />
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <Card key={photo.id} size="sm" className="overflow-hidden p-0">
            <div className="relative aspect-video w-full bg-muted">
              <img
                src={photo.url}
                alt={photo.alt_text ?? ""}
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-3">
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {photo.alt_text || "—"}
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => void deletePhoto(photo)}
              >
                Удалить
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card size="sm" className="flex flex-col gap-4 p-4">
        <p className="text-sm font-medium text-foreground">Добавить фото</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="photo-url">URL</Label>
          <Input
            id="photo-url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="photo-alt">Подпись (alt)</Label>
          <Input
            id="photo-alt"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
          />
        </div>
        <Button type="button" onClick={() => void addPhoto()}>
          Добавить
        </Button>
      </Card>
    </div>
  );
}
