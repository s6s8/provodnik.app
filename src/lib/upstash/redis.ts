import { Redis } from "@upstash/redis";

const redisUrl = process.env.STORAGE_KV_REST_API_URL;
const redisToken = process.env.STORAGE_KV_REST_API_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;
