import { expect, test } from "@playwright/test";

test("auth page hides technical auth configuration names", async ({ page }) => {
  await page.goto("/auth");

  await expect(page.getByText(/NEXT_PUBLIC_SUPABASE/i)).toHaveCount(0);
  await expect(page.getByText(/\.env/i)).toHaveCount(0);
});

test("/tours redirects to готовые экскурсии", async ({ page }) => {
  await page.goto("/tours");

  await expect(page).toHaveURL(/\/listings$/);
  await expect(page.getByRole("heading", { name: /готовые экскурсии/i })).toBeVisible();
});

test("mobile menu opens without missing dialog description warning", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Навигация по разделам Provodnik.")).toBeAttached();
  expect(warnings.join("\n")).not.toContain("Missing `Description`");
});

test("guest request-first form shows Russian validation", async ({ page }) => {
  await page.goto("/");

  const form = page.getByRole("form", { name: "Создать запрос" }).first();
  await expect(form).toBeVisible();

  await form.getByRole("button", { name: /отправить запрос/i }).click();

  await expect(page.getByText("Укажите дату начала.")).toBeVisible();
  await expect(page.getByText("Выберите хотя бы одну категорию")).toBeVisible();
  await expect(page.getByText(/Pick a start date/i)).toHaveCount(0);
});
