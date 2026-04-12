"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";

import { addToFolder, createFolder } from "@/features/favorites/actions/favoritesActions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FavoritesFolderRow } from "@/lib/supabase/types";

type AddToFolderButtonProps = {
  listingId: string;
};

export function AddToFolderButton({ listingId }: AddToFolderButtonProps) {
  const [loggedIn, setLoggedIn] = React.useState<boolean | null>(null);
  const [folders, setFolders] = React.useState<FavoritesFolderRow[]>([]);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const canUseSupabase = hasSupabaseEnv();

  React.useEffect(() => {
    if (!canUseSupabase) {
      setLoggedIn(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(Boolean(user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [canUseSupabase]);

  async function loadFolders() {
    if (!canUseSupabase) return;
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("favorites_folders")
      .select("id, user_id, name, position")
      .eq("user_id", user.id)
      .order("position");
    setFolders((data ?? []) as FavoritesFolderRow[]);
  }

  React.useEffect(() => {
    if (menuOpen && loggedIn) void loadFolders();
  }, [menuOpen, loggedIn]);

  async function pickFolder(folderId: string) {
    setBusy(true);
    try {
      await addToFolder(folderId, listingId);
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  async function submitNewFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await createFolder(name);
      setNewFolderName("");
      await loadFolders();
    } finally {
      setBusy(false);
    }
  }

  const bookmarkButton = (
    <Button
      aria-label="В избранное"
      className="size-9 shrink-0"
      disabled={busy || loggedIn === null}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Bookmark className="size-4" />
    </Button>
  );

  if (!canUseSupabase || loggedIn === false) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                aria-label="В избранное"
                className="size-9 shrink-0"
                disabled={loggedIn === null}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Bookmark className="size-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Войдите для сохранения</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (loggedIn !== true) {
    return (
      <Button aria-label="В избранное" className="size-9 shrink-0" disabled size="icon" type="button" variant="ghost">
        <Bookmark className="size-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>{bookmarkButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {folders.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Нет папок</div>
        ) : (
          folders.map((f) => (
            <DropdownMenuItem
              disabled={busy}
              key={f.id}
              onSelect={() => {
                void pickFolder(f.id);
              }}
            >
              {f.name}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col items-stretch gap-2 p-2" onSelect={(e) => e.preventDefault()}>
          <span className="text-xs font-medium text-muted-foreground">Создать папку</span>
          <Input
            disabled={busy}
            placeholder="Название"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitNewFolder();
              }
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
