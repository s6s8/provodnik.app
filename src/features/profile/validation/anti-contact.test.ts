import { describe, expect, it } from "vitest";

import { findContactInBio } from "./anti-contact";

describe("findContactInBio", () => {
  it.each([
    ["+7 999 123 45 67", "phone"],
    ["89001234567", "phone"],
    ["user@example.com", "email"],
    ["my email is user@ex.com", "email"],
    ["@username_here", "telegram"],
    ["https://t.me/x", "link"],
    ["http://example.com", "link"],
    ["www.example.com", "link"],
  ])("flags %s as %s", (input, expected) => {
    const result = findContactInBio(input);
    expect(result?.kind).toBe(expected);
  });

  it.each([
    "Привет, я Аня",
    "Родилась в 1990 году",
    "Люблю горы и море",
    "5 лет работаю в IT",
  ])("does not flag clean text: %s", (input) => {
    expect(findContactInBio(input)).toBeNull();
  });
});
