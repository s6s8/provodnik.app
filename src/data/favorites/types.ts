export type FavoriteTargetType = "guide" | "listing";

export type FavoriteRecord = {
  id: string;
  userId: string;
  createdAt: string;
  target: {
    type: FavoriteTargetType;
    slug: string;
  };
};

