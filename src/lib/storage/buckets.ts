import { z } from "zod";

export const storageBucketConfig = {
  "guide-avatars": {
    isPublic: true,
    maxBytes: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  },
  "guide-documents": {
    isPublic: false,
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ] as const,
  },
  "listing-media": {
    isPublic: true,
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  },
  "dispute-evidence": {
    isPublic: false,
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ] as const,
  },
} as const;

export const storageBucketIds = Object.keys(storageBucketConfig) as [
  keyof typeof storageBucketConfig,
  ...(keyof typeof storageBucketConfig)[],
];

export const storageBucketSchema = z.enum(storageBucketIds);

export type StorageBucketId = z.infer<typeof storageBucketSchema>;

export function getStorageBucketConfig(bucket: StorageBucketId) {
  return storageBucketConfig[bucket];
}

export function isPublicStorageBucket(bucket: StorageBucketId) {
  return storageBucketConfig[bucket].isPublic;
}
