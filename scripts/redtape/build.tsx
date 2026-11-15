import React from "react";
/**
 * Build the /redtape interactive analytics & register pages as static HTML into dist/redtape.
 * Runs during `npm run build` before `build:latest`, `build:states`, `build:changes`,
 * `build:records`, `build:search`, and `build:sitenav`:
 *   tsx scripts/redtape/build.tsx --out dist
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { REDTAPE_CLIENT_JS } from "./client";
import { fmtInt } from "./format";
import { RedTapeHubPage, RedTapeMethodologyPage } from "./pages";
import { REDTAPE_CSS } from "./styles";
import type {
  AllRedTapeData,
  Pillar1Data,
  Pillar2Data,
  Pillar3Data,
  Pillar4Data,
  Pillar5Data,
  RedTapeMeta,
  TracesIndexData,
  TracesShardData,
} from "./types";

const argOut = process.argv.indexOf("--out");
const OUT = argOut > 0 ? process.argv[argOut + 1]! : "dist";
const HERE = dirname(new URL(import.meta.url).pathname);
const DATA_SRC = join(HERE, "..", "..", "redtape", "data");

function readJson<T>(relPath: string): T {
  const full = join(DATA_SRC, relPath);
  if (!existsSync(full)) {
    throw new Error(`redtape build: required data file missing at ${full}`);
  }
  return JSON.parse(readFileSync(full, "utf8")) as T;
}

function copyDirRecursive(srcDir: string, dstDir: string): void {
  mkdirSync(dstDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const s = join(srcDir, entry.name);
    const d = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (entry.isFile()) {
      copyFileSync(s, d);
    }
  }
}

function writeDualHtml(outRoot: string, relUrlPath: string, html: string): void {
  const clean = relUrlPath.replace(/^\/+|\/+$/g, "");
  const indexTarget = join(outRoot, clean, "index.html");
  const flatTarget = join(outRoot, `${clean}.html`);
  mkdirSync(dirname(indexTarget), { recursive: true });
  mkdirSync(dirname(flatTarget), { recursive: true });
  writeFileSync(indexTarget, html, "utf8");
  writeFileSync(flatTarget, html, "utf8");
}

const meta = readJson<RedTapeMeta>("meta.json");
const pillar1 = readJson<Pillar1Data>("pillar1_durations.json");
const pillar2 = readJson<Pillar2Data>("pillar2_pingpong.json");
const pillar3 = readJson<Pillar3Data>("pillar3_clock_reset.json");
const pillar4 = readJson<Pillar4Data>("pillar4_desks_and_states.json");
const pillar5 = readJson<Pillar5Data>("pillar5_lifecycle_and_trends.json");
const tracesIndex = readJson<TracesIndexData>("traces_index.json");
const featuredTraces = existsSync(join(DATA_SRC, "traces", "featured.json"))
  ? readJson<TracesShardData>("traces/featured.json")
  : { meta: { schema_version: meta.schema_version, is_seed: meta.is_seed, count: 0 }, proposals: {} };

// Build-time data integrity assertions
if (!meta.assertions_passed) {
  throw new Error("redtape build: meta.assertions_passed is false");
}
if (pillar4.state_leaderboard.length !== 36) {
  throw new Error(`redtape build: expected 36 states/UTs in leaderboard, got ${pillar4.state_leaderboard.length}`);
}
for (const card of pillar1.headline_cards) {
  if (card.crunched_n > 0 && card.mean_partition_days.wall != null) {
    const sumParts =
      (card.mean_partition_days.gov ?? 0) +
      (card.mean_partition_days.applicant ?? 0) +
      (card.mean_partition_days.interlock ?? 0);
    if (Math.abs(card.mean_partition_days.wall - sumParts) > 0.2) {
      throw new Error(
        `redtape build: partition mismatch on card ${card.id}: wall=${card.mean_partition_days.wall} vs sum=${sumParts}`
      );
    }
  }
}

const allData: AllRedTapeData = {
  meta,
  pillar1,
  pillar2,
  pillar3,
  pillar4,
  pillar5,
  tracesIndex,
  featuredTraces,
};

// 1. Copy redtape/data/* to dist/redtape/data/* and emit slim ui_strata.json
const outDataDir = join(OUT, "redtape", "data");
copyDirRecursive(DATA_SRC, outDataDir);
const uiStrata = {
  meta: pillar1.meta,
  strata: pillar1.strata.filter((s) => s.portal === "ALL" && s.proposal_purpose === "ALL" && s.n > 0),
};
writeFileSync(join(outDataDir, "ui_strata.json"), JSON.stringify(uiStrata), "utf8");

// 2. Validate client JS syntax & emit CSS + JS
new Function(REDTAPE_CLIENT_JS);
mkdirSync(join(OUT, "redtape"), { recursive: true });
writeFileSync(join(OUT, "redtape", "redtape.css"), REDTAPE_CSS, "utf8");
writeFileSync(join(OUT, "redtape", "redtape.js"), REDTAPE_CLIENT_JS, "utf8");

// 3. Emit dual clean-URL HTML files (/redtape and /redtape/methodology)
const hubHtml = `<!DOCTYPE html>${renderToStaticMarkup(<RedTapeHubPage data={allData} />)}`;
const methodHtml = `<!DOCTYPE html>${renderToStaticMarkup(<RedTapeMethodologyPage data={allData} />)}`;

writeDualHtml(OUT, "redtape", hubHtml);
writeDualHtml(OUT, "redtape/methodology", methodHtml);

// 4. Emit dist/redtape/sitemap.xml (picked up by registers/latest.py into root sitemapindex)
const sitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
  `<url><loc>https://datalibertarian.in/redtape</loc></url>` +
  `<url><loc>https://datalibertarian.in/redtape/methodology</loc></url>` +
  `</urlset>`;
writeFileSync(join(OUT, "redtape", "sitemap.xml"), sitemapXml, "utf8");

// 5. Fill <!--@count:redtape-->...<!--@/count:redtape--> on home snapshot pages
const countLine = `<b>${fmtInt(meta.coverage.p2_directory_clean_total)}</b> PARIVESH 2.0 filings &middot; ${fmtInt(
  meta.coverage.total_timelines_crunched_n
)} traced timelines`;
for (const homeFile of ["index.html", "snapshot.html"]) {
  const p = join(OUT, homeFile);
  if (!existsSync(p)) continue;
  const cur = readFileSync(p, "utf8");
  if (!cur.includes("<!--@count:redtape-->")) continue;
  const next = cur.replace(
    /<!--@count:redtape-->[\s\S]*?<!--@\/count:redtape-->/g,
    `<!--@count:redtape-->${countLine}<!--@/count:redtape-->`
  );
  writeFileSync(p, next, "utf8");
}

console.log(
  `redtape: built 2 pages (${meta.is_seed ? "SEED" : "PRODUCTION"}, ${fmtInt(
    meta.coverage.p2_directory_clean_total
  )} P2 filings, ${fmtInt(meta.coverage.total_timelines_crunched_n)} traced timelines) into ${OUT}/redtape`
);
