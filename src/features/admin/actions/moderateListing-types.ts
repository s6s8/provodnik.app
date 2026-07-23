export type ModerationListingResult =
  | { success: true }
  | { success: false; error: string; alreadyProcessed?: boolean };
