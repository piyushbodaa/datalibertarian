import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const ROOT = process.cwd();
const inInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function loadRedTapeDiskData() {
  const meta = JSON.parse(readFileSync(join(ROOT, "redtape", "data", "meta.json"), "utf8"));
  const pillar1 = JSON.parse(readFileSync(join(ROOT, "redtape", "data", "pillar1_durations.json"), "utf8"));
  return { meta, pillar1 };
}

test("redtape static HTML, data reconciliation, sitemaps, search index, and CSV exports", async ({ request }) => {
  const { meta, pillar1 } = loadRedTapeDiskData();
  expect(meta.is_seed).toBe(false);

  const hubRes = await request.get("/redtape");
  expect(hubRes.status()).toBe(200);
  const hubHtml = await hubRes.text();

  // Global site-nav injected cleanly once + 4-link section subnav
  expect((hubHtml.match(/<!--dl-sitenav-->/g) || []).length).toBe(1);
  expect(hubHtml).toContain('class="dl-nav"');
  expect(hubHtml).toContain('class="dl-subnav"');
  expect(hubHtml).toContain('class="dl-foot"');
  expect(hubHtml).toContain('rel="canonical" href="https://datalibertarian.in/redtape"');
  expect(hubHtml).toContain('property="og:image"');
  expect(hubHtml).not.toContain('data-seed-banner="true"');

  // Dynamic figures match redtape/data/meta.json
  expect(hubHtml).toContain(inInt.format(meta.coverage.p2_directory_clean_total));
  expect(hubHtml).toContain(inInt.format(meta.coverage.total_timelines_crunched_n));

  // Reconcile 4 hero headline stats against pillar1_durations.json (whole-day rounded)
  for (const id of [
    "factories_ec_granted",
    "mines_major_ec_granted",
    "power_gen_ec_granted",
    "power_grid_re_fc_wlc_granted",
  ]) {
    const card = pillar1.headline_cards.find((c: { id: string }) => c.id === id);
    expect(card).toBeTruthy();
    expect(hubHtml).toContain(`data-card-id="${id}"`);
    expect(hubHtml).toContain(`data-crunched-n="${card.crunched_n}"`);
    if (typeof card.wall_days?.median === "number") {
      expect(hubHtml).toContain(inInt.format(Math.round(card.wall_days.median)));
    }
  }

  // Methodology subpage
  const methRes = await request.get("/redtape/methodology");
  expect(methRes.status()).toBe(200);
  const methHtml = await methRes.text();
  expect((methHtml.match(/<!--dl-sitenav-->/g) || []).length).toBe(1);
  expect(methHtml).toContain('rel="canonical" href="https://datalibertarian.in/redtape/methodology"');
  expect(methHtml).toContain(meta.partition_equation);
  expect(methHtml).toContain(inInt.format(meta.directory_volumes_p2_clean.by_target_sector.Mines.noncoal_form2_minor_ec_tor));

  // Open data CSV/JSON exports & sitemap
  for (const assetPath of [
    "/redtape/data/parivesh-sector-state-summary.csv",
    "/redtape/data/parivesh-sample-traces.csv",
    "/redtape/data/meta.json",
    "/redtape/data/ui_strata.json",
    "/redtape/sitemap.xml",
  ]) {
    const r = await request.get(assetPath);
    expect(r.status(), `Expected 200 for ${assetPath}`).toBe(200);
  }

  // Root sitemaps, search index, and home snapshot integration
  const rootSitemap = await (await request.get("/sitemap.xml")).text();
  expect(rootSitemap).toContain("/redtape/sitemap.xml");

  const regSitemap = await (await request.get("/sitemap-registers.xml")).text();
  expect(regSitemap).toContain("https://datalibertarian.in/redtape");

  const searchIdx = await (await request.get("/search-index.json")).json();
  const pageHrefs = (searchIdx.pages || []).map((p: { href: string }) => p.href);
  expect(pageHrefs).toContain("/redtape");
  expect(pageHrefs).toContain("/redtape/methodology");

  const homeHtml = await (await request.get("/")).text();
  expect(homeHtml).toContain('href="/redtape"');
  expect(homeHtml).toContain(inInt.format(meta.coverage.p2_directory_clean_total));
});

test("redtape editorial visuals, trace explorer, toggles, 36-state table, and desktop/mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  // Desktop 1440x900
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/redtape");
  await expect(page.locator("h1")).toContainText("How long it takes to get permission to build in India.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Subnav has exactly 4 links
  await expect(page.locator(".dl-subnav a")).toHaveCount(4);

  // Initial baton-pass timeline & 36 states present
  await expect(page.locator("#rt-trace-detail .rt-legs")).toBeVisible();
  await expect(page.locator("#rt-state-table tbody tr")).toHaveCount(36);

  // Section 1: Compare chart metric & cohort toggles
  const p90Btn = page.locator('[data-cmp-metric="p90"]');
  await p90Btn.click();
  await expect(p90Btn).toHaveAttribute("aria-pressed", "true");

  const pendingBtn = page.locator('[data-cmp-cohort="PENDING_ACTIVE"]');
  await pendingBtn.click();
  await expect(pendingBtn).toHaveAttribute("aria-pressed", "true");

  // Section 2: Trace explorer sector pills, story chips, proposal open & URL sync
  await expect(page.locator("#trace")).toHaveAttribute("data-explorer-ready", "1");
  const factoriesBtn = page.locator('[data-sector="Factories"]');
  await factoriesBtn.click();
  await expect(factoriesBtn).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/sector=Factories/);

  const secondItem = page.locator("#rt-list [data-open-proposal]").nth(1);
  const targetPno = await secondItem.getAttribute("data-open-proposal");
  expect(targetPno).toBeTruthy();
  await secondItem.click();
  await expect(page).toHaveURL(new RegExp(`proposal=${encodeURIComponent(targetPno!)}`));
  await expect(page.locator("#rt-trace-detail")).toContainText(targetPno!);

  // Clear filters
  await page.locator("#rt-reset").click();
  await expect(page).not.toHaveURL(/sector=Factories/);

  // Section 3: Rounds switcher & desk track switcher
  const adsBtn = page.locator('[data-rounds="ads"]');
  await adsBtn.click();
  await expect(adsBtn).toHaveAttribute("aria-pressed", "true");

  const secondTrack = page.locator("[data-desk-track]").nth(1);
  if ((await secondTrack.count()) > 0) {
    const trackKey = await secondTrack.getAttribute("data-desk-track");
    await secondTrack.click();
    await expect(secondTrack).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(`[data-desk-panel="${trackKey}"]`)).toBeVisible();
  }

  // Section 4: 36-State Leaderboard search & null-last sort
  await page.locator("#rt-state-q").fill("Gujarat");
  await expect(page.locator("#rt-state-count")).toContainText("Showing 1 of 36");
  await page.locator("#rt-state-q").fill("");
  await expect(page.locator("#rt-state-count")).toContainText("Showing 36 of 36");

  const medGovSortBtn = page.locator("#rt-state-table thead th").nth(3).locator("button");
  await medGovSortBtn.click();
  const sortedVals = await page
    .locator("#rt-state-table tbody tr td:nth-child(4)")
    .evaluateAll((tds) => tds.map((td) => td.getAttribute("data-val") || ""));
  const firstEmptyIdx = sortedVals.indexOf("");
  if (firstEmptyIdx !== -1) {
    for (let i = firstEmptyIdx; i < sortedVals.length; i++) {
      expect(sortedVals[i]).toBe("");
    }
  }

  // Mobile 390x844 zero-overflow check on /redtape and /redtape/methodology
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/redtape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto("/redtape/methodology");
  await expect(page.locator("h1")).toContainText("How we measure waiting time on PARIVESH.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  expect(errors).toEqual([]);
});
