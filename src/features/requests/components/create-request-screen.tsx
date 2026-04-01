"use client";

import { useState } from "react";
import Link from "next/link";

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
  if (from) return `от ${new Intl.NumberFormat("ru-RU").format(Number(from))} ₽`;
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "9999px",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.9375rem",
  color: "var(--on-surface)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  height: "44px",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--on-surface)",
  marginBottom: "6px",
};

export function CreateRequestScreen() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function focusStyle(field: string): React.CSSProperties {
    if (focusedField === field) {
      return {
        ...inputStyle,
        borderColor: "var(--primary)",
        boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent)",
      };
    }
    return inputStyle;
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
      <section
        style={{
          background: "var(--surface-low)",
          paddingTop: "110px",
          paddingBottom: "40px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p className="sec-label">Новый запрос</p>
          <h1
            className="sec-title"
            style={{ marginTop: "4px" }}
          >
            Создайте запрос — гиды предложат маршрут
          </h1>
          <p
            style={{
              maxWidth: "720px",
              margin: "16px auto 0",
              color: "var(--on-surface-muted)",
              lineHeight: 1.65,
            }}
          >
            Опишите куда, когда и с кем — проводники увидят ваш запрос и пришлют предложения.
          </p>
        </div>
      </section>

      {/* Form layout */}
      <section style={{ paddingBottom: "80px" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 320px",
              gap: "32px",
              alignItems: "start",
              paddingTop: "0",
            }}
            className="create-request-grid"
          >
            {/* Left: form */}
            <form
              onSubmit={handleSubmit}
              className="glass-panel"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
                borderRadius: "var(--glass-radius)",
                padding: "36px",
              }}
            >
              <div style={{ display: "grid", gap: "20px" }}>
                {/* Destination */}
                <div>
                  <label htmlFor="destination" style={labelStyle}>
                    Направление
                  </label>
                  <input
                    id="destination"
                    type="text"
                    placeholder="Байкал, Казань, Алтай…"
                    value={form.destination}
                    onChange={(e) => set("destination", e.target.value)}
                    onFocus={() => setFocusedField("destination")}
                    onBlur={() => setFocusedField(null)}
                    style={focusStyle("destination")}
                  />
                </div>

                {/* Dates */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label htmlFor="date-from" style={labelStyle}>
                      Даты поездки
                    </label>
                    <input
                      id="date-from"
                      type="date"
                      value={form.dateFrom}
                      onChange={(e) => set("dateFrom", e.target.value)}
                      onFocus={() => setFocusedField("date-from")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("date-from")}
                    />
                  </div>
                  <div>
                    <label htmlFor="date-to" style={labelStyle}>
                      До
                    </label>
                    <input
                      id="date-to"
                      type="date"
                      value={form.dateTo}
                      onChange={(e) => set("dateTo", e.target.value)}
                      onFocus={() => setFocusedField("date-to")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("date-to")}
                    />
                  </div>
                </div>

                {/* Group size */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label htmlFor="group-min" style={labelStyle}>
                      Состав группы — минимум
                    </label>
                    <input
                      id="group-min"
                      type="number"
                      min={1}
                      placeholder="2"
                      value={form.groupMin}
                      onChange={(e) => set("groupMin", e.target.value)}
                      onFocus={() => setFocusedField("group-min")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("group-min")}
                    />
                  </div>
                  <div>
                    <label htmlFor="group-max" style={labelStyle}>
                      Максимум
                    </label>
                    <input
                      id="group-max"
                      type="number"
                      min={1}
                      placeholder="6"
                      value={form.groupMax}
                      onChange={(e) => set("groupMax", e.target.value)}
                      onFocus={() => setFocusedField("group-max")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("group-max")}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label htmlFor="budget-from" style={labelStyle}>
                      Бюджет на человека — от ₽
                    </label>
                    <input
                      id="budget-from"
                      type="number"
                      min={0}
                      placeholder="18000"
                      value={form.budgetFrom}
                      onChange={(e) => set("budgetFrom", e.target.value)}
                      onFocus={() => setFocusedField("budget-from")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("budget-from")}
                    />
                  </div>
                  <div>
                    <label htmlFor="budget-to" style={labelStyle}>
                      До ₽
                    </label>
                    <input
                      id="budget-to"
                      type="number"
                      min={0}
                      placeholder="35000"
                      value={form.budgetTo}
                      onChange={(e) => set("budgetTo", e.target.value)}
                      onFocus={() => setFocusedField("budget-to")}
                      onBlur={() => setFocusedField(null)}
                      style={focusStyle("budget-to")}
                    />
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label htmlFor="format" style={labelStyle}>
                    Формат поездки
                  </label>
                  <select
                    id="format"
                    value={form.format}
                    onChange={(e) => set("format", e.target.value)}
                    onFocus={() => setFocusedField("format")}
                    onBlur={() => setFocusedField(null)}
                    style={focusStyle("format")}
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
                  <label htmlFor="description" style={labelStyle}>
                    Описание
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Расскажите подробнее: что важно, чего хотите избежать, особые пожелания…"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      border:
                        focusedField === "description"
                          ? "1px solid var(--primary)"
                          : "1px solid var(--glass-border)",
                      background: "var(--glass-bg)",
                      fontSize: "0.9375rem",
                      color: "var(--on-surface)",
                      outline: "none",
                      resize: "vertical",
                      minHeight: "120px",
                      boxShadow:
                        focusedField === "description"
                          ? "0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent)"
                          : "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Toggle: open group */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "14px 0",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                      }}
                    >
                      Открытая группа
                    </strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        color: "var(--on-surface-muted)",
                        marginTop: "4px",
                      }}
                    >
                      Другие путешественники смогут присоединиться к карточке.
                    </span>
                  </div>
                  <label
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "28px",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.openGroup}
                      onChange={(e) => set("openGroup", e.target.checked)}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        borderRadius: "9999px",
                        background: form.openGroup ? "var(--primary)" : "rgba(0,88,190,0.18)",
                        transition: "background 0.15s",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: form.openGroup ? "23px" : "3px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#fff",
                          boxShadow: "0 2px 10px rgba(25,28,32,0.14)",
                          transition: "left 0.15s",
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* Toggle: accept offers */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "14px 0",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                      }}
                    >
                      Принимать офферы от гидов
                    </strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        color: "var(--on-surface-muted)",
                        marginTop: "4px",
                      }}
                    >
                      Предложения появятся сразу после публикации запроса.
                    </span>
                  </div>
                  <label
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "28px",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.acceptOffers}
                      onChange={(e) => set("acceptOffers", e.target.checked)}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        borderRadius: "9999px",
                        background: form.acceptOffers ? "var(--primary)" : "rgba(0,88,190,0.18)",
                        transition: "background 0.15s",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: form.acceptOffers ? "23px" : "3px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#fff",
                          boxShadow: "0 2px 10px rgba(25,28,32,0.14)",
                          transition: "left 0.15s",
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", marginTop: "28px" }}
              >
                Опубликовать запрос
              </button>
            </form>

            {/* Right: sticky preview */}
            <aside
              style={{ position: "sticky", top: "96px" }}
              className="preview-aside"
            >
              <p className="sec-label">Так будет выглядеть ваш запрос</p>
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
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "0.875rem",
                  color: "var(--on-surface-muted)",
                  lineHeight: 1.65,
                }}
              >
                После публикации гиды увидят ваш запрос и начнут присылать предложения.
              </p>
            </aside>
          </div>
        </div>
      </section>

    </main>
  );
}
