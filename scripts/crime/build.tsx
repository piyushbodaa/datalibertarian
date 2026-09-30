import React from "react";
/**
 * Build the /crime register pages as static HTML into dist/crime.
 * Runs after the main build: `tsx scripts/crime/build.tsx --out dist`.
 * Styles come from the shared register sheet (/babuwatch/styles.css) plus crime.css.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ncrb2024More, ncrb2024Rape } from "../../src/data/crime/ncrb2024";
import { ncrb2023Rape } from "../../src/data/crime/ncrb2023Rape";
import { rapePlaces } from "../../src/data/crime/rapePlaces";
import { murderSeries } from "../../src/data/crime/decadeSeries";
import { HubPage } from "./site/pages/hub";
import { MethodPage } from "./site/pages/method";
import { MurderPage } from "./site/pages/murder";
import { RapePage } from "./site/pages/rape";
import { StealingPage } from "./site/pages/stealing";

const argOut = process.argv.indexOf("--out");
const OUT = argOut > 0 ? process.argv[argOut + 1]! : "dist";
const HERE = dirname(new URL(import.meta.url).pathname);

// Claims the page text makes in words, checked against the year the pages show (2024).
const m = ncrb2024More;
const up = m.states.find((s) => s.name === "Uttar Pradesh")!;
const most = [...m.states].sort((a, b) => b.murder.y2024 - a.murder.y2024)[0]!;
if (most.name !== "Uttar Pradesh" || up.murder.rate >= m.national.murder.y2024.rate) throw new Error("murder: UP claim no longer true");
const delhiTheftShare = m.states.find((s) => s.name === "Delhi")!.theft.cases / m.national.theft.y2024.cases;
if (delhiTheftShare < 0.25 || delhiTheftShare > 0.34) throw new Error("theft: 'nearly a third' claim no longer true");
const disputes = m.murderMotives.find((x) => x.label === "Disputes")!.cases / m.national.murder.y2024.cases;
if (disputes < 0.3 || disputes > 0.37) throw new Error("murder: 'one in three' claim no longer true");
for (const n of ["Himachal Pradesh", "Goa", "Chandigarh"]) {
  const s = ncrb2024Rape.states.find((x) => x.name === n)!;
  if (!(s.girlsUnder18 > s.childRapePocso)) throw new Error(`rape: ${n} files girls mostly under s.376 — claim no longer true`);
}
if (ncrb2024Rape.national.rape >= ncrb2023Rape.national.rape || ncrb2024Rape.national.childRapePocso <= ncrb2023Rape.national.childRapePocso) throw new Error("rape: 'adult count fell, child count rose' no longer true");

for (const r of murderSeries) {
  if (!r.motives) continue;
  // The page says disputes are the largest *named* motive group; the residual mixes many rows.
  if (Math.max(r.motives.vendetta, r.motives.loveOrIllicit, r.motives.gain) >= r.motives.disputes) throw new Error(`murder ${r.year}: disputes no longer the largest named motive`);
}

// The home page (public/snapshot.html) carries a few hand-typed crime figures; keep them tied to the data.
const home = readFileSync(join(HERE, "..", "..", "public", "snapshot.html"), "utf8");
const inrFmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
for (const figure of [
  inrFmt(ncrb2024Rape.national.rape + ncrb2024Rape.national.childRapePocso),
  inrFmt(ncrb2024Rape.national.rape),
  inrFmt(m.national.murder.y2024.cases),
  `${(m.national.theft.y2024.cases / 100000).toFixed(1)} lakh`,
  "2024 tables",
  "2022 to 2024",
]) {
  if (!home.includes(figure)) throw new Error(`home page crime section is stale: expected "${figure}"`);
}

const pages: [string, () => ReactElement][] = [
  ["crime", HubPage],
  ["crime/rape", RapePage],
  ["crime/murder", MurderPage],
  ["crime/stealing", StealingPage],
  ["crime/method", MethodPage],
];

for (const [path, Page] of pages) {
  const html = `<!DOCTYPE html>${renderToStaticMarkup(<Page />)}`;
  mkdirSync(join(OUT, path), { recursive: true });
  writeFileSync(join(OUT, path, "index.html"), html);
  writeFileSync(join(OUT, `${path}.html`), html);
}

const assets = join(HERE, "site", "assets");
for (const f of readdirSync(assets)) copyFileSync(join(assets, f), join(OUT, "crime", f));
const vendor = join(OUT, "crime", "vendor");
mkdirSync(join(vendor, "images"), { recursive: true });
const leaflet = join(HERE, "..", "..", "node_modules", "leaflet", "dist");
copyFileSync(join(leaflet, "leaflet.js"), join(vendor, "leaflet.js"));
copyFileSync(join(leaflet, "leaflet.css"), join(vendor, "leaflet.css"));
for (const f of readdirSync(join(leaflet, "images"))) copyFileSync(join(leaflet, "images", f), join(vendor, "images", f));
writeFileSync(join(OUT, "crime", "rape", "districts.json"), JSON.stringify(rapePlaces));

console.log(`crime: wrote ${pages.length} pages to ${OUT}/crime`);
