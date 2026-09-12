import { test, expect } from "@playwright/test";

test("sources are reachable from overview and comparison", async ({ page }) => {
  for (const path of ["/", "/compare?left=maharashtra&right=karnataka"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("[data-citation-id]").first()).toBeVisible();
    const broken = await page.locator("[data-citation-id]").evaluateAll(links => links.filter(link => !document.getElementById(`cite-${link.getAttribute("data-citation-id")}`)).map(link => link.getAttribute("data-citation-id")));
    expect(broken).toEqual([]);
    await page.locator("[data-citation-id]").first().click();
    await expect(page.locator(":target")).toBeFocused();
  }
});

test("static pages expose figures and metadata without JavaScript", async ({ request }) => {
  const state = await request.get("/sikkim/police");
  expect(state.status()).toBe(200);
  const html=await state.text();
  expect(html.replace(/<!--.*?-->/g, "")).toContain("Sikkim Police");expect(html).toContain('rel="canonical"');expect(html).toContain('property="og:image"');
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("<urlset");
  const missing=await request.get("/not-a-real-page");expect(missing.status()).toBe(404);expect(await missing.text()).toContain('content="noindex"');
});

test("coverage, mobile comparison, clipboard failure, and CSV", async ({ page, context }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByRole("list",{name:"States we have read"}).getByRole("link")).toHaveCount(27);
  await page.goto("/compare?left=maharashtra&right=karnataka");
  await page.getByRole("combobox",{name:"Right book",exact:true}).selectOption("sikkim");
  await expect(page).toHaveURL(/right=sikkim/);
  await expect(page.getByRole("heading",{name:"Sikkim",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{value:{writeText:()=>Promise.reject(new Error("denied"))},configurable:true}));
  await page.getByRole("button",{name:"Copy link",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Copy was unavailable");
  const download=page.waitForEvent("download");await page.getByRole("button",{name:"CSV",exact:true}).click();expect((await download).suggestedFilename()).toContain("sikkim");
  await context.grantPermissions(["clipboard-read","clipboard-write"]);
});

test("failed lazy page offers recovery", async ({ page }) => {
  await page.goto("/");
  await page.route("**/assets/Compare-*.js",route=>route.abort());
  await page.getByRole("link",{name:"Compare",exact:true}).first().click();
  await expect(page.getByRole("alert")).toContainText("This page could not load");
  await expect(page.getByRole("button",{name:"Reload page"})).toBeVisible();
});
