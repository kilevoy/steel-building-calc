import { expect, test } from "@playwright/test";

/**
 * Browser smoke tests. The unit/acceptance suite covers the engines; these
 * tests cover what it cannot: each tab actually renders in a browser, lazy
 * chunks load, the shared BuildingContext propagates between tabs and the
 * summary auto-calculation produces visible results.
 */

const TAB_LABELS = [
  "Колонна",
  "Ферма",
  "Прогоны",
  "Балка покрытия",
  "Оконные ригели",
  "Подкрановая балка",
  "Сводка",
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("оболочка: все вкладки, баннер здания и вкладка колонны рендерятся", async ({ page }) => {
  for (const label of TAB_LABELS) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Здание (общее)")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Калькулятор стальных колонн промышленных зданий" }),
  ).toBeVisible();
});

test("ферма: lazy-чанк загружается и авторасчёт выдаёт результат", async ({ page }) => {
  await page.getByRole("button", { name: "Ферма", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Калькулятор стальной фермы покрытия" }),
  ).toBeVisible();
  // Auto-recompute runs on mount — a details section with forces must appear.
  await expect(page.getByRole("heading", { name: /— детали/ }).first()).toBeVisible();
});

test("прогоны: lazy-чанк загружается и показывает подобранные сечения", async ({ page }) => {
  await page.getByRole("button", { name: "Прогоны", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Калькулятор прогонов покрытия" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Подобранные сечения/ }),
  ).toBeVisible();
});

test("балка покрытия, оконные ригели и подкрановая балка открываются", async ({ page }) => {
  await page.getByRole("button", { name: "Балка покрытия", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Балка покрытия", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Оконные ригели", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Оконные ригели", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Подкрановая балка", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Подкрановая балка", exact: true })).toBeVisible();
});

test("сводка: автоматический расчёт собирает результаты по зданию", async ({ page }) => {
  await page.getByRole("button", { name: "Сводка", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Сводка по зданию" })).toBeVisible();
  // Summary auto-calculates all engines on mount; the empty-state hint must
  // give way to the populated description.
  await expect(
    page.getByText("Подобранные профили и металлоёмкость из всех вкладок"),
  ).toBeVisible({ timeout: 30_000 });
});

test("общие параметры здания: изменение пролёта видно в баннере", async ({ page }) => {
  const banner = page.locator('div[title^="Эти параметры синхронизированы"]');
  await expect(banner).toContainText("пролёт");

  const spanInput = page.locator('label:has-text("Пролёт, м") + input').first();
  await spanInput.fill("30");
  await expect(banner).toContainText("пролёт 30 м");
});
