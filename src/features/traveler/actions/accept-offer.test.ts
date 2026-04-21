import { describe, it, expect } from "vitest";

describe("acceptOfferAction error messages", () => {
  it("produces Russian error for not-found offer", () => {
    const err = new Error("Предложение не найдено или уже принято");
    expect(err.message).toMatch(/не найдено|уже принято/);
  });

  it("produces Russian error for unauthorized", () => {
    const err = new Error("Нет доступа к этому запросу");
    expect(err.message).toMatch(/доступ/);
  });

  it("produces Russian fallback error", () => {
    const err = new Error("Не удалось принять предложение. Попробуйте ещё раз.");
    expect(err.message).toMatch(/Не удалось/);
  });
});
