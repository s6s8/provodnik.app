type SeedUserCredentials = {
  email: string;
  password: string;
};

const QA_PASSWORD = process.env.QA_SEED_PASSWORD ?? "";

export const SEED_USERS: {
  admin: SeedUserCredentials;
  guide: SeedUserCredentials;
  traveler: SeedUserCredentials;
} = {
  admin: {
    email: "qa-admin@example.com",
    password: QA_PASSWORD,
  },
  guide: {
    email: "qa-guide@example.com",
    password: QA_PASSWORD,
  },
  traveler: {
    email: "qa-traveler@example.com",
    password: QA_PASSWORD,
  },
};

export const E2E_READY = QA_PASSWORD.length > 0;
