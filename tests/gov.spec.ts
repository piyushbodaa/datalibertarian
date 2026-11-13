import { test, expect } from "@playwright/test";

test("gov.in directory renders macro view, filters, subpages, CSV and subdomain host", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gov");
  await expect(page.locator("h1")).toContainText(".gov.in");
  await expect(page.locator(".tile .v").first()).toBeVisible();
  await expect(page.locator("#ministries tbody tr")).toHaveCount(55);
  await expect(page.locator("#states tbody tr")).toHaveCount(37); // India summary + 36 states/UTs

  // Mobile layout must not overflow horizontally
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Interactive filter & URL sync
  await expect(page.locator("#dir-status")).toContainText("Index ready");
  await page.locator("#f-state").selectOption("Maharashtra");
  await expect(page).toHaveURL(/state=Maharashtra/);
  await expect(page.locator("#dir-count")).toContainText("Showing 1");

  // Group by root domain toggle
  await page.locator("#f-group").check();
  await expect(page).toHaveURL(/grouped=1/);
  await expect(page.locator("#dir-count")).toContainText("root .gov.in zones");

  // Subpages, CSV, and Host-header rewrite
  for (const path of ["/gov/ministries", "/gov/regulators", "/gov/local-and-courts", "/gov/uncharted", "/gov/gov-in-websites.csv"]) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  }

  const subRes = await request.get("/", { headers: { host: "gov.datalibertarian.in" } });
  expect(subRes.status()).toBe(200);
  expect(await subRes.text()).toContain("Every .gov.in website of the Indian state, mapped.");

  const homeRes = await request.get("/", { headers: { host: "datalibertarian.in" } });
  expect(homeRes.status()).toBe(200);
  expect(await homeRes.text()).toContain("The Indian state, on the record.");

  const missingRes = await request.get("/does-not-exist-anywhere");
  expect(missingRes.status()).toBe(404);
});
