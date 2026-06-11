import { z } from "zod";

export const uuidSchema = z.uuid();
export const replyBodySchema = z.string().trim().min(1).max(2000);
