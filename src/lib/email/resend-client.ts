import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!serverEnv.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!_resend) {
    _resend = new Resend(serverEnv.RESEND_API_KEY);
  }
  return _resend;
}
