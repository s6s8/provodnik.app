import type { Destination } from "@/data/destinations/schema";

export type DestinationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  destination: Destination;
};

