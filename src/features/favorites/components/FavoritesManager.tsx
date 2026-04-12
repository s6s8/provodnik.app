"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createFolder, deleteFolder, removeFromFolder } from "@/features/favorites/actions/favoritesActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { FavoritesFolderRow, FavoritesItemRow } from "@/lib/supabase/types";

export type FavoritesManagerProps = {
  folders: (FavoritesFolderRow & {
    items: (FavoritesItemRow & {
      listing: {
        id: string;
        title: string;
        image_url: string | null;
        price_from_minor: number;
        region: string;
      };
    })[];
  })[];
};

function formatPriceFromMinor(minor: number): string {
  const rub = minor / 100;
  return `от ${new Intl.NumberFormat("ru-RU").format(rub)} ₽`;
}

export function FavoritesManager({ folders }: FavoritesManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(folders[0]?.id ?? null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<FavoritesFolderRow | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (folders.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !folders.some((f) => f.id === selectedId)) {
      setSelectedId(folders[0]!.id);
    }
  }, [folders, selectedId]);

  const selected = folders.find((f) => f.id === selectedId) ?? null;

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      await createFolder(trimmed);
      setNewName("");
      setCreateOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await deleteFolder(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleRemove(listingId: string) {
    if (!selected) return;
    setPending(true);
    try {
      await removeFromFolder(selected.id, listingId);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <aside className="w-full shrink-0 space-y-3 md:max-w-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">Папки</p>
          <Button size="sm" type="button" variant="outline" onClick={() => setCreateOpen(true)}>
            + Создать папку
          </Button>
        </div>
        <Separator />
        <ul className="space-y-1">
          {folders.length === 0 ? (
            <li className="text-sm text-muted-foreground">Нет папок</li>
          ) : (
            folders.map((folder) => (
              <li key={folder.id} className="flex items-center gap-2">
                <Button
                  className={cn(
                    "min-w-0 flex-1 justify-start",
                    selectedId === folder.id && "bg-accent",
                  )}
                  size="sm"
                  type="button"
                  variant={selectedId === folder.id ? "secondary" : "ghost"}
                  onClick={() => setSelectedId(folder.id)}
                >
                  <span className="truncate">{folder.name}</span>
                </Button>
                <Button
                  aria-label="Удалить папку"
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteTarget(folder)}
                >
                  ×
                </Button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        {!selected ? (
          <p className="text-sm text-muted-foreground">Выберите папку или создайте новую.</p>
        ) : selected.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">В этой папке пока нет объявлений.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selected.items.map((item) => (
              <Card className="gap-0 overflow-hidden py-0" key={item.listing_id}>
                <div
                  className={cn(
                    "relative aspect-[4/3] w-full overflow-hidden",
                    !item.listing.image_url && "bg-gradient-to-br from-surface-high to-border",
                  )}
                >
                  {item.listing.image_url ? (
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={item.listing.image_url}
                    />
                  ) : null}
                </div>
                <CardContent className="flex flex-col gap-3 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug">{item.listing.title}</h3>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{item.listing.region}</p>
                  <p className="text-sm font-medium">{formatPriceFromMinor(item.listing.price_from_minor)}</p>
                  <Button
                    disabled={pending}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => void handleRemove(item.listing_id)}
                  >
                    Удалить из папки
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая папка</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="favorites-folder-name">Название</Label>
            <Input
              id="favorites-folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button disabled={pending || !newName.trim()} type="button" onClick={() => void handleCreate()}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить папку?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Папка «{deleteTarget?.name}» и все сохранённые в ней объявления будут удалены из избранного.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button
              disabled={pending}
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
