import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { citations, getCitation } from "./sources.ts";
import {
  functionalPolice,
  grantB1,
  police2055,
  police2055Lines,
  police4055,
  stateTotalExpenditure,
} from "./maharashtra-police.ts";
import {
  demand51Capital,
  demand51Groups,
  demand51Net,
  demand51Revenue,
  mhaTotalBe2627,
} from "./union/demand-51.ts";
import { delhiEstInfra } from "./union/delhi-police.ts";
import { apLastFound, INDEX_ROWS, indexPoliceLines } from "./prs-index/afs-police.ts";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "./uttar-pradesh/police.ts";
import { tgArms220, tgCity4055, tgObject010 } from "./telangana/police.ts";
import { commissionerates, cpHero, getCommissionerate } from "./telangana/commissionerates.ts";
import { stations } from "./telangana/stations.ts";
import { wb2055Gross, wb2055Net, wb4055, wbArms, wbClothing, wbFunctional, wbSalariesDesk } from "./west-bengal/police.ts";
import { gj2055, gj2055Minors, gj4055, gjFunctional } from "./gujarat/police.ts";
import { tn2055, tn4055, tnDemand22Voted, tnFunctional } from "./tamil-nadu/police.ts";
import { jurisdictions } from "./states.ts";

const allMoney = [
  ...functionalPolice.amounts,
  ...police2055.amounts,
  ...police4055.amounts,
  ...grantB1.amounts,
  ...stateTotalExpenditure,
  ...police2055Lines.flatMap((l) => l.amounts),
  ...demand51Net.amounts,
  ...demand51Revenue.amounts,
  ...demand51Capital.amounts,
  ...demand51Groups.flatMap((l) => l.amounts),
  mhaTotalBe2627,
  ...delhiEstInfra.amounts,
  ...indexPoliceLines.flatMap((l) => l.amounts),
  apLastFound.be2425,
  apLastFound.actual2425,
  ...up2055Voted.amounts,
  ...up4055.amounts,
  ...upFunctional.amounts,
  ...upSalariesDesk.amounts,
  ...upUniforms.amounts,
  ...tgObject010.amounts,
  ...tgArms220.amounts,
  ...tgCity4055.amounts,
  ...commissionerates.flatMap((c) => c.combined.amounts),
  ...wb2055Net.amounts,
  ...wb2055Gross.amounts,
  ...wb4055.amounts,
  ...wbFunctional.amounts,
  ...wbSalariesDesk.amounts,
  ...wbArms.amounts,
  ...wbClothing.amounts,
  ...gj2055.amounts,
  ...gj4055.amounts,
  ...gjFunctional.amounts,
  ...gj2055Minors.flatMap((l) => l.amounts),
  ...tn2055.amounts,
  ...tn4055.amounts,
  ...tnFunctional.amounts,
  ...tnDemand22Voted.amounts,
];

describe("every figure has a living citation", () => {
  it("resolves citationId for every Money row", () => {
    for (const m of allMoney) {
      const c = getCitation(m.citationId);
      assert.ok(c.url.startsWith("https://"));
      assert.ok(c.publisher.length > 0);
    }
  });

  it("does not use Grant B-1 as the functional Police hero", () => {
    const hero = functionalPolice.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    );
    const b1 = grantB1.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    );
    assert.ok(hero && b1);
    assert.notEqual(Math.round(hero.crore), Math.round(b1.crore));
    assert.ok(b1.crore > hero.crore);
  });

  it("2055 voted minor heads sum to the 2055 voted net for 2026-27 BE", () => {
    const sum = police2055Lines
      .map((l) => l.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!.rupees)
      .reduce((a, b) => a + b, 0);
    const netVoted = 32_668_960_8000;
    assert.equal(sum, netVoted);
  });

  it("keeps locked GOLD heroes", () => {
    const mh = functionalPolice.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
    const d51 = demand51Net.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
    assert.ok(mh && d51);
    assert.equal(Math.round(mh.crore * 100) / 100, 33116.49);
    assert.equal(d51.crore, 173802.53);
  });

  it("keeps required GOLD and INDEX citations (does not freeze the old 5-key list)", () => {
    for (const id of [
      "mh-appropriation-2025-26",
      "mh-home-whitebook-2026-27",
      "mh-pink-book-2026-27",
      "union-sbe51-2026-27",
      "union-sumsbe-2026-27",
      "union-sbe51-2025-26",
      "up-grant26-2026-27",
      "tg-law-home-2026-27",
      "tg-law-home-2026-27-hyd",
      "tg-law-home-2026-27-cyberabad",
      "tg-law-home-2026-27-hod",
      "wb-demand68-2026-27",
      "gj-home-2026-27",
      "tn-demand22-2026-27",
      "prs-andhra-pradesh",
    ]) {
      assert.ok(citations[id], `missing ${id}`);
    }
  });

  it("Union hero is Demand 51 net, not the whole Home Ministry", () => {
    const hero = demand51Net.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
    assert.ok(hero);
    assert.ok(mhaTotalBe2627.crore > hero.crore);
    const rev = demand51Revenue.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = demand51Capital.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(Math.round((rev.crore + cap.crore) * 100) / 100, hero.crore);
  });
});

describe("INDEX warehouse", () => {
  it("has exactly 27 PRS AFS envelopes for 2025-26 BE", () => {
    assert.equal(INDEX_ROWS.length, 27);
    assert.equal(indexPoliceLines.length, 27);
    assert.equal(INDEX_ROWS[0].be2526, 38777);
    assert.equal(INDEX_ROWS.find((r) => r.slug === "maharashtra")?.be2526, 33743);
    assert.equal(INDEX_ROWS.find((r) => r.slug === "telangana")?.be2526, 9641);
    assert.equal(INDEX_ROWS.find((r) => r.slug === "tamil-nadu")?.be2526, 12714);
    assert.equal(INDEX_ROWS.find((r) => r.slug === "rajasthan")?.be2526, 11125);
    assert.ok(!INDEX_ROWS.some((r) => r.slug === "delhi"));
    assert.ok(!INDEX_ROWS.some((r) => r.slug === "andhra-pradesh"));
    for (const r of INDEX_ROWS) {
      assert.ok(citations[r.cite], r.cite);
      assert.ok(citations[r.cite].url.includes("prsindia.org"));
    }
  });

  it("does not overwrite Maharashtra White Book with PRS INDEX", () => {
    const mh = functionalPolice.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const idx = INDEX_ROWS.find((r) => r.slug === "maharashtra")!;
    assert.notEqual(mh.crore, idx.be2526);
  });
});

describe("GOLD modules copy pack figures", () => {
  it("Uttar Pradesh Grant 26", () => {
    assert.equal(up2055Voted.amounts[0].crore, 37880.58);
    assert.equal(up4055.amounts[0].crore, 4052.29);
    assert.equal(upSalariesDesk.amounts[0].crore, 18570.02);
    assert.equal(upUniforms.amounts[0].crore, 42.03);
    assert.equal(upFunctional.amounts[0].crore, 37880.58 + 4052.29);
  });

  it("Telangana Law+Home Police slice — not Home grant, not Hyd CP", () => {
    const be26 = tgObject010.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const be25 = tgObject010.amounts.find((a) => a.fiscalYear === "2025-26" && a.series === "be")!;
    assert.equal(be26.crore, 8852.93);
    assert.equal(be25.crore, 7252.86);
    assert.equal(tgArms220.amounts[0].crore, 24.53);
    assert.equal(tgCity4055.amounts[0].crore, 132.25);
    assert.notEqual(be26.crore, 11906.83);
    assert.notEqual(be26.crore, 10188.01);
  });

  it("Telangana commissionerates are HoD GOLD, not state 010, not station money", () => {
    const hyd = getCommissionerate("hyderabad-city")!;
    const cyber = getCommissionerate("cyberabad")!;
    const racha = getCommissionerate("rachakonda")!;
    const malka = getCommissionerate("malkajgiri")!;
    const future = getCommissionerate("future-city")!;
    assert.equal(
      hyd.combined.amounts.find((a) => a.fiscalYear === "2025-26")?.crore,
      2096.08,
    );
    assert.equal(
      hyd.combined.amounts.find((a) => a.fiscalYear === "2026-27")?.crore,
      2125.85,
    );
    assert.equal(
      cyber.combined.amounts.find((a) => a.fiscalYear === "2025-26")?.crore,
      742.57,
    );
    assert.equal(
      cyber.combined.amounts.find((a) => a.fiscalYear === "2026-27")?.crore,
      787.86,
    );
    assert.equal(racha.combined.amounts.find((a) => a.fiscalYear === "2025-26")?.crore, 684.61);
    assert.equal(racha.combined.amounts.find((a) => a.fiscalYear === "2026-27"), undefined);
    assert.equal(malka.combined.amounts.find((a) => a.fiscalYear === "2026-27")?.crore, 751.69);
    assert.equal(future.combined.amounts.find((a) => a.fiscalYear === "2026-27")?.crore, 118.14);
    const o010 = tgObject010.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.notEqual(cpHero(hyd).crore, o010.crore);
    assert.notEqual(cpHero(hyd).crore, 9641);
    const printedSum = commissionerates
      .flatMap((c) => c.combined.amounts.filter((a) => a.fiscalYear === "2026-27"))
      .reduce((s, a) => s + a.crore, 0);
    assert.notEqual(Math.round(printedSum * 100) / 100, o010.crore);
    assert.notEqual(Math.round(printedSum * 100) / 100, 11906.83);
  });

  it("named stations have no rupee field", () => {
    assert.equal(stations.length, 1);
    assert.equal(stations[0].slug, "bachupally");
    assert.equal(stations[0].cp, "cyberabad");
    assert.equal(stations[0].tier, "empty");
    assert.ok(!("amounts" in stations[0]));
    assert.ok(!("crore" in stations[0]));
  });

  it("West Bengal Demand 68 slices", () => {
    assert.equal(wb2055Net.amounts[0].crore, 13806.68);
    assert.equal(wb2055Gross.amounts[0].crore, 13806.83);
    assert.equal(wb4055.amounts[0].crore, 471.57);
    assert.equal(wbSalariesDesk.amounts[0].crore, 10763.83);
    assert.equal(wbArms.amounts[0].crore, 81.54);
    assert.equal(wbClothing.amounts[0].crore, 1.65);
  });

  it("Delhi est+infra is Union, not a state rank", () => {
    const be26 = delhiEstInfra.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(be26.crore, 12846.15);
    assert.equal(
      delhiEstInfra.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "be")?.crore,
      11400.81,
    );
    assert.equal(
      delhiEstInfra.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")?.crore,
      12366.77,
    );
    const d51Delhi = demand51Groups.find((g) => g.id === "delhi-police")!;
    const estOnly = d51Delhi.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.notEqual(be26.crore, estOnly.crore);
    assert.notEqual(be26.crore, 173802.53);
  });

  it("four-way tiers: gold / index / blocked / empty", () => {
    assert.equal(jurisdictions.find((j) => j.slug === "maharashtra")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "uttar-pradesh")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "telangana")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "west-bengal")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "gujarat")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "tamil-nadu")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "rajasthan")?.tier, "index");
    assert.equal(jurisdictions.find((j) => j.slug === "andhra-pradesh")?.tier, "blocked");
    assert.equal(jurisdictions.find((j) => j.slug === "delhi")?.tier, "empty");
    assert.equal(apLastFound.be2425.crore, 7874);
    assert.equal(apLastFound.actual2425.crore, 7695);
  });

  it("Gujarat Demand 043 2055 + isolated 4055", () => {
    const run = gj2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = gj4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = gjFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.crore, 9055.62);
    assert.equal(cap.crore, 964.73);
    assert.equal(Math.round(hero.crore * 100) / 100, 10020.35);
    assert.ok(!run.citationId.startsWith("prs-"));
    const minorSum = gj2055Minors
      .map((l) => l.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!.crore)
      .reduce((s, n) => s + n, 0);
    assert.equal(Math.round(minorSum * 100) / 100, run.crore);
  });

  it("Tamil Nadu Demand 22 isolates 2055+4055 from the mixed demand", () => {
    const run = tn2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = tn4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = tnDemand22Voted.amounts[0];
    const hero = tnFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 124_359_957_000);
    assert.equal(cap.rupees, 3_535_408_000);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
  });
});
