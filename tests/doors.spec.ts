import { test, expect } from "@playwright/test";

test("new doors render cited figures and compare handles GHMC and Health", async ({ page }) => {
  await page.goto("/telangana/health");
  await expect(page.locator("h1")).toHaveText("Telangana Health");
  await expect(page.getByText("13,997.08 crore").first()).toBeVisible();

  await page.goto("/gram");
  await expect(page.getByText("9,385.62 crore").first()).toBeVisible();

  await page.goto("/municipal/ghmc");
  await expect(page.getByText("8,440 crore").first()).toBeVisible();
  await expect(page.getByText("2026-27 is not in a book yet")).toBeVisible();

  await page.goto("/karnataka/health");
  await expect(page.locator("h1")).toHaveText("Karnataka Health");
  await expect(page.getByText("Not read yet")).toBeVisible();

  await page.goto("/compare?left=telangana&right=maharashtra");
  await expect(page.locator("h1")).toBeVisible();
  const health = page.getByText("Running hospitals", { exact: true });
  await expect(health.first()).toBeVisible();

  await page.goto("/compare?left=ghmc");
  await expect(page.getByText("City total", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("8,440").first()).toBeVisible();

  await page.goto("/trace/municipal/ghmc");
  await expect(page.getByText("Running the city", { exact: true }).first()).toBeVisible();
});
