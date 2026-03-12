export type FavoriteTargetType = "guide" | "listing";

export type FavoriteTarget = {
  type: FavoriteTargetType;
  slug: string;
};

export type FavoriteRecord = {
  id: string;
  userId: string;
  createdAt: string;
  target: {
    type: FavoriteTargetType;
    slug: string;
  };
};

export type FavoriteEntry = {
  createdAt: string;
  removed?: true;
};

