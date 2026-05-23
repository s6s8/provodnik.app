import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let _resend: Resend | null = null;
let _resendApiKey: string | null = null;

export function getResendClient(): Resend {
  const currentKey = serverEnv.RESEND_API_KEY;
  if (!currentKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  // Re-create if API key changed (e.g., hot reload or env swap)
  if (!_resend || _resendApiKey !== currentKey) {
    _resend = new Resend(currentKey);
    _resendApiKey = currentKey;
  }
  return _resend;
}
