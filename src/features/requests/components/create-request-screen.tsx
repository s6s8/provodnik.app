"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ReqCard } from "@/components/shared/req-card";

const FORMAT_OPTIONS = [
  "Природа и активный отдых",
  "Города и культура",
  "Гастрономия",
  "Семейный",
  "Экстрим",
] as const;

interface FormState {
  destination: string;
  dateFrom: string;
  dateTo: string;
  groupMin: string;
  groupMax: string;
  budgetFrom: string;
  budgetTo: string;
  format: string;
  description: string;
  openGroup: boolean;
  acceptOffers: boolean;
}

const defaultForm: FormState = {
  destination: "",
  dateFrom: "",
  dateTo: "",
  groupMin: "",
  groupMax: "",
  budgetFrom: "",
  budgetTo: "",
  format: FORMAT_OPTIONS[0],
  description: "",
  openGroup: true,
  acceptOffers: true,
};

function formatDateRange(from: string, to: string): string {
  if (from && to) return `${from} — ${to}`;
  if (from) return `С ${from}`;
  if (to) return `До ${to}`;
  return "Даты не выбраны";
}

function formatBudget(from: string, to: string): string {
  if (from && to) {
    const f = Number(from);
    const t = Number(to);
    if (!isNaN(f) && !isNaN(t)) {
      return `${new Intl.NumberFormat("ru-RU").format(f)} — ${new Intl.NumberFormat("ru-RU").format(t)} ₽`;
    }
  }
  if (from)
    return `от ${new Intl.NumberFormat("ru-RU").format(Number(from))} ₽`;
  if (to) return `до ${new Intl.NumberFormat("ru-RU").format(Number(to))} ₽`;
  return "— тыс. ₽";
}

function formatSpots(min: string, max: string): string {
  const mn = Number(min);
  const mx = Number(max);
  if (min && max && !isNaN(mn) && !isNaN(mx)) return `${mn} / ${mx} мест`;
  if (max && !isNaN(mx)) return `0 / ${mx} мест`;
  return "0 / 0 мест";
}

const inputClassName =
  "h-11 w-full rounded-full border border-glass-border bg-glass px-4 py-3 text-[0.9375rem] text-on-surface outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/[0.08]";
const labelClassName =
  "mb-1.5 block text-[0.8125rem] font-semibold text-on-surface";

export function CreateRequestScreen() {
  const [form, setForm] = useState<FormState>(defaultForm);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  const previewLocation = form.destination || "Ваше направление";
  const previewSpots = formatSpots(form.groupMin, form.groupMax);
  const previewTitle = form.destination
    ? `Поездка в ${form.destination}`
    : "Название запроса";
  const previewDate = formatDateRange(form.dateFrom, form.dateTo);
  const previewDesc = form.description || form.format;
  const previewPrice = formatBudget(form.budgetFrom, form.budgetTo);
  const previewFillPct =
    form.groupMin && form.groupMax
      ? Math.round((Number(form.groupMin) / Number(form.groupMax)) * 100)
      : 0;

  return (
    <main>
      {/* Page header */}
      <section className="bg-surface-low pb-10 pt-[110px] text-center">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Новый запрос
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            Создайте запрос — гиды предложат маршрут
          </h1>
          <p className="mx-auto mt-4 max-w-[720px] leading-[1.65] text-on-surface-muted">
            Опишите куда, когда и с кем — проводники увидят ваш запрос и пришлют
            предложения.
          </p>
        </div>
      </section>

      {/* Form layout */}
      <section className="pb-20">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-8 max-md:grid-cols-1">
            {/* Left: form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-glass border border-glass-border bg-glass p-9 shadow-glass backdrop-blur-[20px]"
            >
              <div className="grid gap-5">
                {/* Destination */}
                <div>
                  <label htmlFor="destination" className={labelClassName}>
                    Направление
                  </label>
                  <input
                    id="destination"
                    type="text"
                    placeholder="Байкал, Казань, Алтай…"
                    value={form.destination}
                    onChange={(e) => set("destination", e.target.value)}
                    className={inputClassName}
                  />
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="date-from" className={labelClassName}>
                      Даты поездки
                    </label>
                    <input
                      id="date-from"
                      type="date"
                      value={form.dateFrom}
                      onChange={(e) => set("dateFrom", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="date-to" className={labelClassName}>
                      До
                    </label>
                    <input
                      id="date-to"
                      type="date"
                      value={form.dateTo}
                      onChange={(e) => set("dateTo", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* Group size */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="group-min" className={labelClassName}>
                      Состав группы — минимум
                    </label>
                    <input
                      id="group-min"
                      type="number"
                      min={1}
                      placeholder="2"
                      value={form.groupMin}
                      onChange={(e) => set("groupMin", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="group-max" className={labelClassName}>
                      Максимум
                    </label>
                    <input
                      id="group-max"
                      type="number"
                      min={1}
                      placeholder="6"
                      value={form.groupMax}
                      onChange={(e) => set("groupMax", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="budget-from" className={labelClassName}>
                      Бюджет на человека — от ₽
                    </label>
                    <input
                      id="budget-from"
                      type="number"
                      min={0}
                      placeholder="18000"
                      value={form.budgetFrom}
                      onChange={(e) => set("budgetFrom", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="budget-to" className={labelClassName}>
                      До ₽
                    </label>
                    <input
                      id="budget-to"
                      type="number"
                      min={0}
                      placeholder="35000"
                      value={form.budgetTo}
                      onChange={(e) => set("budgetTo", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label htmlFor="format" className={labelClassName}>
                    Формат поездки
                  </label>
                  <select
                    id="format"
                    value={form.format}
                    onChange={(e) => set("format", e.target.value)}
                    className={inputClassName}
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className={labelClassName}>
                    Описание
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Расскажите подробнее: что важно, чего хотите избежать, особые пожелания…"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="min-h-[120px] w-full resize-y rounded-[14px] border border-glass-border bg-glass px-4 py-3 font-inherit text-[0.9375rem] text-on-surface outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/[0.08]"
                  />
                </div>

                {/* Toggle: open group */}
                <div className="flex items-center justify-between gap-4 py-[14px]">
                  <div>
                    <strong className="block text-[0.8125rem] font-semibold text-on-surface">
                      Открытая группа
                    </strong>
                    <span className="mt-1 block text-[0.875rem] text-on-surface-muted">
                      Другие путешественники смогут присоединиться к карточке.
                    </span>
                  </div>
                  <label className="relative h-7 w-12 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.openGroup}
                      onChange={(e) => set("openGroup", e.target.checked)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span
                      className={`relative block h-full w-full rounded-full transition-colors duration-150 ${
                        form.openGroup ? "bg-primary" : "bg-primary/20"
                      }`}
                    >
                      <span
                        style={{
                          top: "3px",
                          left: form.openGroup ? "23px" : "3px",
                          position: "absolute",
                        }}
                        className="size-[22px] rounded-full bg-white shadow-[0_2px_10px_rgba(25,28,32,0.14)] transition-[left] duration-150"
                      />
                    </span>
                  </label>
                </div>

                {/* Toggle: accept offers */}
                <div className="flex items-center justify-between gap-4 py-[14px]">
                  <div>
                    <strong className="block text-[0.8125rem] font-semibold text-on-surface">
                      Принимать офферы от гидов
                    </strong>
                    <span className="mt-1 block text-[0.875rem] text-on-surface-muted">
                      Предложения появятся сразу после публикации запроса.
                    </span>
                  </div>
                  <label className="relative h-7 w-12 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptOffers}
                      onChange={(e) => set("acceptOffers", e.target.checked)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span
                      className={`relative block h-full w-full rounded-full transition-colors duration-150 ${
                        form.acceptOffers ? "bg-primary" : "bg-primary/20"
                      }`}
                    >
                      <span
                        style={{
                          top: "3px",
                          left: form.acceptOffers ? "23px" : "3px",
                          position: "absolute",
                        }}
                        className="size-[22px] rounded-full bg-white shadow-[0_2px_10px_rgba(25,28,32,0.14)] transition-[left] duration-150"
                      />
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="mt-7 w-full">
                Опубликовать запрос
              </Button>
            </form>

            {/* Right: sticky preview */}
            <aside className="sticky top-24">
              <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Так будет выглядеть ваш запрос
              </p>
              <ReqCard
                href="#"
                location={previewLocation}
                spotsLabel={previewSpots}
                title={previewTitle}
                date={`${previewDate} · ${form.format || "Формат"}`}
                desc={previewDesc || undefined}
                fillPct={previewFillPct}
                avatars={[]}
                price={previewPrice}
              />
              <p className="mt-4 text-[0.875rem] leading-[1.65] text-on-surface-muted">
                После публикации гиды увидят ваш запрос и начнут присылать
                предложения.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
