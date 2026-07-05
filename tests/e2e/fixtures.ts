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

// The tripster-v1 suites create/modify real rows (listings, offers, bookings,
// disputes, reviews). The local build talks to the LIVE Supabase, so running them
// here would write junk into production. They only run when an isolated,
// throwaway DB is wired and mutation is explicitly opted into. Gate, don't guess.
export const E2E_MUTATIONS_READY =
  E2E_READY && process.env.E2E_ALLOW_MUTATIONS === "1";
