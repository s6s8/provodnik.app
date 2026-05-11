type SeedUserCredentials = {
  email: string;
  password: string;
};

export const SEED_USERS: {
  admin: SeedUserCredentials;
  traveler: SeedUserCredentials;
  guide: SeedUserCredentials;
} = {
  admin: {
    email: "admin@provodnik.test",
    password: "Admin1234!",
  },
  traveler: {
    email: "traveler@provodnik.test",
    password: "Travel1234!",
  },
  guide: {
    email: "guide@provodnik.test",
    password: "Guide1234!",
  },
};
