"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingVideoRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Props {
  listingId: string;
}

function getLooseClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch" || u.pathname.startsWith("/watch")) {
        return u.searchParams.get("v");
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] ?? null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function previewImageForVideo(row: ListingVideoRow): string | null {
  const yt = extractYoutubeId(row.url);
  if (yt) {
    return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  }
  const poster = row.poster_url?.trim();
  return poster ? poster : null;
}

export function VideosSection({ listingId }: Props) {
  const [videos, setVideos] = useState<ListingVideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const supabase = getLooseClient();
    const { data, error } = await supabase
      .from("listing_videos")
      .select("id, listing_id, url, poster_url, position")
      .eq("listing_id", listingId)
      .order("position", { ascending: true });
    if (!error && data) {
      setVideos(data as ListingVideoRow[]);
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchVideos();
  }, [fetchVideos]);

  const addVideo = async () => {
    const u = url.trim();
    if (!u) return;
    const supabase = getLooseClient();
    const poster = posterUrl.trim();
    const { error } = await supabase.from("listing_videos").insert({
      listing_id: listingId,
      url: u,
      poster_url: poster || null,
      position: videos.length,
    });
    if (!error) {
      setUrl("");
      setPosterUrl("");
      void fetchVideos();
    }
  };

  const deleteVideo = async (video: ListingVideoRow) => {
    const supabase = getLooseClient();
    const { error } = await supabase
      .from("listing_videos")
      .delete()
      .eq("id", video.id);
    if (!error) void fetchVideos();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full max-w-2xl rounded-glass" />
        <Skeleton className="h-24 w-full max-w-2xl rounded-glass" />
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        {videos.map((video) => {
          const preview = previewImageForVideo(video);
          return (
            <Card key={video.id} size="sm" className="overflow-hidden p-0">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      URL
                    </Label>
                    <p className="break-all text-sm font-medium">{video.url}</p>
                  </div>
                  {video.poster_url ? (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Постер
                      </Label>
                      <p className="break-all text-sm text-muted-foreground">
                        {video.poster_url}
                      </p>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-auto w-full sm:w-auto"
                    onClick={() => void deleteVideo(video)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card size="sm" className="flex flex-col gap-4 p-4">
        <p className="text-sm font-medium">Добавить видео</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-video-url">Ссылка (YouTube / Vimeo)</Label>
          <Input
            id="listing-video-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-video-poster">URL превью (необязательно)</Label>
          <Input
            id="listing-video-poster"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <Button type="button" onClick={() => void addVideo()}>
          Добавить видео
        </Button>
      </Card>
    </div>
  );
}
