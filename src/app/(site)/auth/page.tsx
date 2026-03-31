import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { redirect } from "next/navigation";

import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

const benefits = [
  "Войти по email и паролю как путешественник, гид или администратор",
  "Сохранить запросы, бронирования, отзывы и рабочие статусы в одном кабинете",
  "После входа сразу перейти в свое рабочее пространство без лишних шагов",
] as const;

export default async function AuthPage() {
  const authContext = await readAuthContextFromServer();

  if (authContext.missingRoleRecoveryTo) {
    redirect(authContext.missingRoleRecoveryTo);
  }

  if (authContext.canonicalRedirectTo) {
    redirect(authContext.canonicalRedirectTo);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
      <div className="section-frame rounded-[2.2rem] p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Аккаунт Provodnik
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Вход в Provodnik для работы с поездками, запросами и бронированиями
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Авторизация теперь работает через email и пароль: для входа в свой
              кабинет, запуска рабочего профиля и перехода в нужную роль без
              отдельной magic-link процедуры. Если Supabase временно недоступен,
              ниже остается демо-сценарий для просмотра рабочих областей.
            </p>
          </div>

          <div className="grid gap-3">
            {benefits.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-white/72 p-4"
              >
                <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-border/70 bg-[linear-gradient(135deg,rgba(27,97,123,0.08),rgba(226,155,90,0.12))] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Star className="size-4 text-accent-foreground" />
              Демо-вход как резервный сценарий
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Если интеграция Supabase еще не подключена в этой среде, Provodnik
              сохраняет локальный демо-режим для быстрого переключения между ролями
              и проверки рабочих сценариев.
            </p>
          </div>
        </div>
      </div>

      <AuthEntryScreen />
    </section>
  );
}
