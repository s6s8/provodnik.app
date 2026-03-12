import { listSeededFavoritesForUser } from "@/data/favorites/seed";
import type {
  FavoriteEntry,
  FavoriteRecord,
  FavoriteTarget,
  FavoriteTargetType,
} from "@/data/favorites/types";

const STORAGE_KEY_PREFIX = "provodnik.favorites.v1.";
const FAVORITES_CHANGED_EVENT = "provodnik:favorites-changed";

type FavoritesState = Record<string, FavoriteEntry>;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function favoriteKey(type: FavoriteTargetType, slug: string) {
  return `${type}:${slug}`;
}

function parseFavoriteKey(key: string): FavoriteTarget | null {
  const [type, ...rest] = key.split(":");
  const slug = rest.join(":");
  if ((type !== "guide" && type !== "listing") || !slug) return null;
  return { type, slug };
}

function dispatchFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

function getLocalState(userId: string): FavoritesState {
  if (typeof window === "undefined") return {};
  const parsed = safeParseJson<FavoritesState>(
    window.localStorage.getItem(storageKey(userId)),
  );
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function saveLocalState(userId: string, state: FavoritesState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  dispatchFavoritesChanged();
}

function ensureSeededInitialized(userId: string) {
  if (typeof window === "undefined") return;
  const existing = window.localStorage.getItem(storageKey(userId));
  if (existing) return;

  const seeded = listSeededFavoritesForUser(userId);
  const initial: FavoritesState = {};
  for (const item of seeded) {
    initial[favoriteKey(item.target.type, item.target.slug)] = {
      createdAt: item.createdAt,
    };
  }
  window.localStorage.setItem(storageKey(userId), JSON.stringify(initial));
}

export function subscribeToFavoritesChanged(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  function onEvent() {
    callback();
  }

  window.addEventListener(FAVORITES_CHANGED_EVENT, onEvent);
  window.addEventListener("storage", onEvent);
  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, onEvent);
    window.removeEventListener("storage", onEvent);
  };
}

export function listFavoritesForUser(userId: string): FavoriteRecord[] {
  ensureSeededInitialized(userId);
  const state = getLocalState(userId);

  return Object.entries(state)
    .flatMap(([key, entry]) => {
      if (!entry || entry.removed) return [];
      const target = parseFavoriteKey(key);
      if (!target) return [];
      return [
        {
          id: `${userId}::${key}`,
          userId,
          createdAt: entry.createdAt,
          target,
        } satisfies FavoriteRecord,
      ];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isFavorite(
  userId: string,
  type: FavoriteTargetType,
  slug: string,
): boolean {
  ensureSeededInitialized(userId);
  const state = getLocalState(userId);
  const entry = state[favoriteKey(type, slug)];
  return Boolean(entry && !entry.removed);
}

export function toggleFavorite(
  userId: string,
  type: FavoriteTargetType,
  slug: string,
) {
  ensureSeededInitialized(userId);
  const state = getLocalState(userId);
  const key = favoriteKey(type, slug);
  const current = state[key];

  if (current && !current.removed) {
    state[key] = { ...current, removed: true };
  } else {
    state[key] = { createdAt: new Date().toISOString() };
  }

  saveLocalState(userId, state);
}

export function clearRemovedFavorites(userId: string) {
  ensureSeededInitialized(userId);
  const state = getLocalState(userId);
  let changed = false;

  for (const [key, entry] of Object.entries(state)) {
    if (entry?.removed) {
      delete state[key];
      changed = true;
    }
  }

  if (changed) saveLocalState(userId, state);
}

