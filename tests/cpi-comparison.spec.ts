import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const evidence = JSON.parse(
  readFileSync("src/data/inflation/independent-quotes.json", "utf8"),
);
const distinctItems = new Set(
  evidence.quotes.map((q: { itemCode: string }) => q.itemCode),
).size;

test("sanitized retailer evidence keeps prices, provenance and honest labels", async ({ page, request }) => {
  await page.goto("/inflation");
  await page.getByRole("searchbox", { name: "Find a basket item" }).fill("IKEA");
  await expect(page.getByRole("link", { name: "Archived page (keys redacted)", exact: true })).toHaveCount(1);
  const downloaded = await (await request.get("/data/inflation/independent-quotes.json")).json();
  const sources = downloaded.sources.filter((source: { evidenceType: string }) => source.evidenceType === "sanitized-fetched-html");
  expect(sources).toHaveLength(3);
  for (const source of sources) {
    const response = await request.get(source.archive);
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(/AIza[0-9A-Za-z_-]{35}/.test(body)).toBe(false);
    expect(body).toContain("[REDACTED_GOOGLE_API_KEY]");
    expect(source.sanitization.originalSha256).not.toBe(source.sha256);
  }
  expect(downloaded.quotes.map((quote: { price: number }) => quote.price)).toEqual(
    evidence.quotes.map((quote: { price: number }) => quote.price),
  );
});

test("full CPI comparison preserves all items, sector weights, prices and incomplete evidence", async ({
  page,
  request,
}) => {
  await page.goto("/inflation");
  await expect(page.getByTestId("official-yoy")).toHaveText("+6.09%");
  await expect(page.getByTestId("private-result")).toHaveText(
    "Not yetmeasurable.",
  );
  await expect(page.getByTestId("basket-item")).toHaveCount(358);
  await expect(page.locator(".cpi-division")).toHaveCount(12);
  await expect(page.getByTestId("quoted-item-count")).toHaveText(
    `${distinctItems} / 358`,
  );
  await page.getByRole("button", { name: "Rural", exact: true }).click();
  await expect(page.getByTestId("official-yoy")).toHaveText("+6.63%");
  await page.getByRole("button", { name: "Urban", exact: true }).click();
  await expect(page.getByTestId("official-yoy")).toHaveText("+5.41%");
  await page.getByRole("button", { name: "All India", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Find a basket item" })
    .fill("Aashirvaad");
  await expect(page.getByTestId("basket-item")).toHaveCount(1);
  await expect(page.locator(".cpi-quote-price")).toHaveText("₹310for 5 kg");
  await expect(page.locator(".cpi-item-weight")).toContainText("basket weight");
  await page
    .getByRole("searchbox", { name: "Find a basket item" })
    .fill("Tuition fees (Primary");
  await expect(page.getByTestId("basket-item")).toHaveCount(1);
  await expect(page.locator(".cpi-provider-comparison")).toContainText(
    "+6.76%",
  );
  await expect(page.locator(".cpi-provider-comparison")).toContainText(
    "Academic year 2025–26",
  );
  await expect(page.locator(".cpi-official-record")).toContainText("Service");
  await page.getByRole("searchbox", { name: "Find a basket item" }).fill("");
  await page
    .getByLabel("Independent evidence", { exact: true })
    .selectOption("quoted");
  await expect(page.getByTestId("basket-item")).toHaveCount(distinctItems);
  await page
    .getByLabel("Independent evidence", { exact: true })
    .selectOption("missing");
  await expect(page.getByTestId("basket-item")).toHaveCount(
    358 - distinctItems,
  );
  await page
    .getByLabel("Independent evidence", { exact: true })
    .selectOption("");
  await page
    .getByRole("searchbox", { name: "Find a basket item" })
    .fill("unfindablewordxyz");
  await expect(
    page.getByText("No basket items match these filters."),
  ).toBeVisible();
  for (const file of [
    "cpi-ledger.csv",
    "cpi-basket.csv",
    "cpi-basket.json",
    "cpi-official.json",
    "independent-quotes.json",
    "cpi-collection-template.csv",
    "cpi-state-item-weights.json",
    "cpi-method.md",
  ]) {
    const response = await request.get(`/data/inflation/${file}`);
    expect(response.ok(), file).toBe(true);
  }
  const ledger = await (
    await request.get("/data/inflation/cpi-comparison.json")
  ).json();
  expect(ledger.rows).toHaveLength(358);
  expect(ledger.independentAudits.combined.yoyPct).toBeNull();
  const downloaded = await (
    await request.get("/data/inflation/independent-quotes.json")
  ).json();
  expect(downloaded.quotes).toHaveLength(evidence.quotes.length);
  await page
    .getByRole("link", { name: "How the index is built", exact: true })
    .click();
  await expect(page.locator("h1")).toContainText(
    "The same basket. A traceable calculation.",
  );
});

test("basket works without JavaScript and adapts to small screens", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/inflation");
  const government = await page.locator(".cpi-government").boundingBox();
  const independent = await page.locator(".cpi-private").boundingBox();
  expect(Math.abs(government!.width - independent!.width)).toBeLessThan(2);
  expect(independent!.x).toBeGreaterThan(government!.x);
  const ledger = await page.locator(".cpi-column-head").boundingBox();
  const officialRate = await page.locator(".cpi-division-rate").first().boundingBox();
  expect(officialRate!.x + officialRate!.width).toBeLessThanOrEqual(ledger!.x + ledger!.width / 2);
  await page.screenshot({
    path: "/tmp/cpi-comparison-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Expand all divisions" }).click();
  await expect(page.locator(".cpi-division[open]")).toHaveCount(12);
  await page.getByRole("button", { name: "Collapse all divisions" }).click();
  await expect(page.locator(".cpi-division[open]")).toHaveCount(0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByTestId("official-yoy")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `viewport ${width}`,
    ).toBe(true);
    await page
      .getByRole("searchbox", { name: "Find a basket item" })
      .fill("Wheat atta");
    await expect(page.locator(".cpi-quote-price")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/cpi-comparison-mobile-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("searchbox", { name: "Find a basket item" }).fill("");
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:4173/inflation");
  await expect(staticPage.getByTestId("basket-item")).toHaveCount(358);
  await expect(staticPage.getByTestId("official-yoy")).toHaveText("+6.09%");
  await staticPage.locator(".cpi-division>summary").first().click();
  await expect(staticPage.locator(".cpi-division").first()).toHaveAttribute(
    "open",
    "",
  );
  await expect(staticPage.locator(".cpi-quote").first()).toBeVisible();
  await context.close();
});
