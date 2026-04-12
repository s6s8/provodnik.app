"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend-client";
import { getSiteUrl } from "@/lib/env";

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendPasswordResetEmail(
  email: string,
): Promise<ForgotPasswordResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { ok: false, error: "Введите email." };
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: trimmed,
      options: {
        redirectTo: `${getSiteUrl()}/auth/confirm`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("user not found")) {
        return { ok: true };
      }
      return { ok: false, error: "Не удалось создать ссылку для сброса пароля." };
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      return { ok: false, error: "Не удалось создать ссылку для сброса пароля." };
    }

    const resend = getResendClient();
    const { error: emailError } = await resend.emails.send({
      from: "Provodnik <noreply@provodnik.app>",
      to: trimmed,
      subject: "Сброс пароля — Provodnik",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Сброс пароля</h2>
          <p style="color: #555; margin-bottom: 24px;">
            Мы получили запрос на сброс пароля для вашего аккаунта.<br/>
            Нажмите кнопку ниже, чтобы создать новый пароль.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; background: #000; color: #fff; text-decoration: none;
                    padding: 12px 24px; border-radius: 9999px; font-size: 14px; font-weight: 500;">
            Создать новый пароль
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">
            Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
            Ссылка действует 1 час.
          </p>
        </div>
      `,
    });

    if (emailError) {
      return { ok: false, error: "Не удалось отправить письмо. Попробуйте позже." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось отправить письмо. Попробуйте позже." };
  }
}
