import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const snapshot = JSON.parse(
  readFileSync("src/data/inflation/private-snapshot.json", "utf8"),
);

test("published index, filters, and base-period spending calculate consistently", async ({
  page,
  request,
}) => {
  await page.goto("/inflation");
  await expect(page.getByTestId("published-yoy")).toHaveText("+14.60%");
  await expect(page.locator(".index-table tbody tr")).toHaveCount(22);
  await page.getByRole("searchbox", { name: "Find an item" }).fill("onion");
  await expect(page.locator(".index-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".index-table tbody")).toContainText("53.49");
  await page
    .getByRole("searchbox", { name: "Find an item" })
    .fill("does-not-exist");
  await expect(
    page.getByText("No commodities match this filter."),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Find an item" }).fill("");
  await page.getByRole("combobox", { name: "Category" }).selectOption("oils");
  await expect(page.locator(".index-table tbody tr")).toHaveCount(6);
  await page.locator(".spending-editor summary").click();
  await page.getByRole("button", { name: "Set all to zero" }).click();
  await expect(page.getByRole("status")).toContainText("at least one item");
  await page.getByLabel("Rice", { exact: true }).fill("1000");
  const rice = snapshot.rows.find(
    (row: { id: string; current: number; yearAgo: number }) =>
      row.id === "rice",
  )!;
  await expect(page.getByTestId("personal-yoy")).toHaveText(
    `+${((rice.current / rice.yearAgo - 1) * 100).toFixed(2)}%`,
  );
  await expect(page.getByTestId("published-yoy")).toHaveText("+14.60%");
  await page.getByLabel("Rice", { exact: true }).fill("-1");
  await expect(page.getByRole("status")).toContainText(
    "valid non-negative amount",
  );
  await page.getByLabel("Rice", { exact: true }).fill("");
  await expect(page.getByRole("status")).toContainText(
    "valid non-negative amount",
  );
  await page.getByRole("button", { name: "Reset to ₹100 each" }).click();
  await expect(page.getByTestId("personal-yoy")).toHaveText("+14.60%");
  for (const category of [
    "food",
    "fuel",
    "housing",
    "health",
    "education",
    "transport",
    "clothing",
    "other",
  ]) {
    expect((await request.get(`/inflation/${category}`)).ok()).toBe(true);
  }
  const json = await request.get("/data/inflation/private-index.json");
  expect(json.ok()).toBe(true);
  const csv = await request.get("/data/inflation/private-index.csv");
  expect(csv.ok()).toBe(true);
  expect(await csv.text()).toContain("53.49");
  const archive = await request.get(snapshot.metadata.sourceArchive);
  expect(archive.ok()).toBe(true);
  expect(await archive.text()).toContain("16/11/2026");
  await page
    .getByRole("link", { name: "Read the complete methodology" })
    .click();
  await expect(page.locator("h1")).toContainText(
    "The basket. The arithmetic. The limits.",
  );
  await expect(
    page.getByRole("heading", {
      name: "Towards an independent national index",
    }),
  ).toBeVisible();
});

test("inflation works on mobile and renders source-backed content without JavaScript", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inflation");
  await expect(page.getByTestId("published-yoy")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/inflation-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 700 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: "/tmp/inflation-desktop.png", fullPage: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:4173/inflation");
  await expect(staticPage.getByTestId("published-yoy")).toHaveText("+14.60%");
  await expect(staticPage.locator(".index-table tbody tr")).toHaveCount(22);
  await context.close();
});
