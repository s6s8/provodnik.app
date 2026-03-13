import { CheckCircle2, ShieldCheck, Star } from "lucide-react";

import { AuthEntryScreen } from "@/features/auth/components/auth-entry-screen";

const benefits = [
  "Войти как путешественник, гид или оператор",
  "Сохранить маршруты, отзывы и рабочие статусы в одном месте",
  "Перейти из витрины сразу в рабочий кабинет",
] as const;

export default function AuthPage() {
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
              Вход в сервис для бронирования и работы с поездками
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              По magic-link вы попадаете в кабинет путешественника, гида или
              оператора. Это не отдельный промо-лендинг, а точка входа в реальную
              рабочую среду сервиса.
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
              Если Supabase не настроен
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Защищенные разделы всё равно можно просмотреть через локальный демо-режим
              в шапке рабочих областей.
            </p>
          </div>
        </div>
      </div>

      <AuthEntryScreen />
    </section>
  );
}
