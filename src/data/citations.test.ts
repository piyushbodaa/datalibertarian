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
import {
  unionCapitalExpenditure,
  unionOutstandingLiabilities,
  unionRevenueExpenditure,
  unionTotalExpenditure,
} from "./union/budget-at-a-glance.ts";
import { LAYERS } from "./layers.ts";
import { tg2210, tg2211, tg4210, tg4211, tgHealthCap, tgHealthDepartment, tgHealthFunctional, tgHealthRun } from "./telangana/health.ts";
import { tg2501, tg2506, tg2515, tg4515, tgGramFunctional, tgPrrdDepartment, tgRuralRevenueTotal } from "./telangana/gram.ts";
import { bmcCapital, bmcRevenue, bmcTotal, ghmcCapital, ghmcRevenue, ghmcTotal, municipalBodies } from "./municipal/ghmc.ts";
import { tgObject010 } from "./telangana/police.ts";
import { healthBooks } from "./health/books.ts";
import { utPoliceBooks } from "./union/ut-police.ts";
import { compareRows, intersectYears, resolveSide } from "./compare/resolve.ts";
import { delhiEstInfra } from "./union/delhi-police.ts";
import { apLastFound, INDEX_ROWS, indexPoliceLines } from "./prs-index/afs-police.ts";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "./uttar-pradesh/police.ts";
import { tgArms220, tgCity4055, tgObject010 } from "./telangana/police.ts";
import { commissionerates, cpHero, getCommissionerate } from "./telangana/commissionerates.ts";
import { stations } from "./telangana/stations.ts";
import { wb2055Gross, wb2055Net, wb4055, wbArms, wbClothing, wbFunctional, wbSalariesDesk } from "./west-bengal/police.ts";
import { gj2055, gj2055Minors, gj4055, gjFunctional } from "./gujarat/police.ts";
import { tn2055, tn4055, tnDemand22Voted, tnFunctional } from "./tamil-nadu/police.ts";
import { ka109, ka2055, ka4055, kaDemand05Home, kaFunctional } from "./karnataka/police.ts";
import { kl2055, kl4055, klFunctional } from "./kerala/police.ts";
import { od2055, odDemand01, odFunctional } from "./odisha/police.ts";
import { ap2055, ap4055, apDemandX, apFunctional } from "./andhra-pradesh/police.ts";
import { pb2055, pb4055, pbFunctional } from "./punjab/police.ts";
import { hr2055, hr4055, hrFunctional } from "./haryana/police.ts";
import { uk2055, uk4055, ukFunctional, ukGrant10 } from "./uttarakhand/police.ts";
import { as2055, as4055, asFunctional } from "./assam/police.ts";
import { cg2055, cg4055, cgDemand02, cgFunctional } from "./chhattisgarh/police.ts";
import { jh2055, jh4055, jhDemand22, jhFunctional } from "./jharkhand/police.ts";
import { ga2055, ga4055, gaDemand17, gaFunctional } from "./goa/police.ts";
import { ar2055, ar4055, arFunctional } from "./arunachal-pradesh/police.ts";
import { ml2055, ml4055, mlFunctional } from "./meghalaya/police.ts";
import { mn2055, mn4055, mnDemand07, mnFunctional } from "./manipur/police.ts";
import { mz2055, mz4055, mzFunctional } from "./mizoram/police.ts";
import { nl2055, nl4055, nlFunctional } from "./nagaland/police.ts";
import { tr2055, tr4055, trFunctional } from "./tripura/police.ts";
import { sk2055, sk4055, skFunctional } from "./sikkim/police.ts";
import { rj2055, rj4055, rjDemand18, rjFunctional } from "./rajasthan/police.ts";
import { hp2055, hp4055, hpDemand07, hpFunctional } from "./himachal-pradesh/police.ts";
import { br2055, br4055, brDemand22, brFunctional } from "./bihar/police.ts";
import { getJurisdiction, jurisdictions } from "./states.ts";

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
  ...unionTotalExpenditure.amounts,
  ...unionRevenueExpenditure.amounts,
  ...unionCapitalExpenditure.amounts,
  ...unionOutstandingLiabilities.amounts,
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
  ...ka2055.amounts,
  ...ka4055.amounts,
  ...kaFunctional.amounts,
  ...ka109.amounts,
  ...kaDemand05Home.amounts,
  ...kl2055.amounts,
  ...kl4055.amounts,
  ...klFunctional.amounts,
  ...od2055.amounts,
  ...odFunctional.amounts,
  ...odDemand01.amounts,
  ...ap2055.amounts,
  ...ap4055.amounts,
  ...apFunctional.amounts,
  ...apDemandX.amounts,
  ...uk2055.amounts,
  ...uk4055.amounts,
  ...ukFunctional.amounts,
  ...ukGrant10.amounts,
  ...tr2055.amounts,
  ...tr4055.amounts,
  ...trFunctional.amounts,
  ...ml2055.amounts,
  ...ml4055.amounts,
  ...mlFunctional.amounts,
  ...mn2055.amounts,
  ...mn4055.amounts,
  ...mnFunctional.amounts,
  ...mnDemand07.amounts,
  ...nl2055.amounts,
  ...nl4055.amounts,
  ...nlFunctional.amounts,
  ...mz2055.amounts,
  ...mz4055.amounts,
  ...mzFunctional.amounts,
  ...ar2055.amounts,
  ...ar4055.amounts,
  ...arFunctional.amounts,
  ...as2055.amounts,
  ...as4055.amounts,
  ...asFunctional.amounts,
  ...cg2055.amounts,
  ...cg4055.amounts,
  ...cgFunctional.amounts,
  ...cgDemand02.amounts,
  ...jh2055.amounts,
  ...jh4055.amounts,
  ...jhFunctional.amounts,
  ...jhDemand22.amounts,
  ...ga2055.amounts,
  ...ga4055.amounts,
  ...gaFunctional.amounts,
  ...gaDemand17.amounts,
  ...pb2055.amounts,
  ...pb4055.amounts,
  ...pbFunctional.amounts,
  ...hr2055.amounts,
  ...hr4055.amounts,
  ...hrFunctional.amounts,
  ...sk2055.amounts,
  ...sk4055.amounts,
  ...skFunctional.amounts,
  ...rj2055.amounts,
  ...rj4055.amounts,
  ...rjFunctional.amounts,
  ...rjDemand18.amounts,
  ...tg2210.amounts,
  ...tg2211.amounts,
  ...tg4210.amounts,
  ...tg4211.amounts,
  ...tgHealthRun.amounts,
  ...tgHealthCap.amounts,
  ...tgHealthFunctional.amounts,
  ...tgHealthDepartment.amounts,
  ...tg2501.amounts,
  ...tg2506.amounts,
  ...tg2515.amounts,
  ...tg4515.amounts,
  ...tgGramFunctional.amounts,
  ...tgRuralRevenueTotal.amounts,
  ...tgPrrdDepartment.amounts,
  ...ghmcTotal.amounts,
  ...ghmcRevenue.amounts,
  ...ghmcCapital.amounts,
  ...bmcTotal.amounts,
  ...bmcRevenue.amounts,
  ...bmcCapital.amounts,
  ...hp2055.amounts,
  ...hp4055.amounts,
  ...hpFunctional.amounts,
  ...hpDemand07.amounts,
  ...br2055.amounts,
  ...br4055.amounts,
  ...brFunctional.amounts,
  ...brDemand22.amounts,
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
    const pink = stateTotalExpenditure.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
    assert.equal(pink?.crore, 769466.87);
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
      "tg-afs-2026-27",
      "tg-bib-2026-27",
      "ghmc-be-2025-26",
      "bmc-be-2026-27",
      "wb-demand68-2026-27",
      "gj-home-2026-27",
      "tn-demand22-2026-27",
      "ka-expvol1-2026-27",
      "kl-afs-2026-27",
      "od-d01-2026-27",
      "ap-afs-2026-27",
      "ap-vol3-3-2026-27",
      "pb-afs-2026-27",
      "pb-capital-2026-27",
      "hr-afs-2026-27",
      "uk-afs-2026-27",
      "uk-vol5-g10-2026-27",
      "as-afs-2026-27",
      "cg-afs-2026-27",
      "cg-t02-2026-27",
      "jh-afs-2026-27",
      "ga-afs-2026-27",
      "ga-vol1-2026-27",
      "tr-afs-2026-27",
      "ml-afs-2026-27",
      "mn-afs-2026-27",
      "mn-dfg-2026-27",
      "nl-afs-2026-27",
      "mz-afs-2026-27",
      "ar-afs-2026-27",
      "sk-afs-2026-27",
      "rj-vol2b-2026-27",
      "rj-vol3a-2026-27",
      "rj-vol1-2026-27",
      "hp-afs-2026-27",
      "hp-d07-2026-27",
      "br-afs-2026-27",
      "br-dfg-2026-27",
      "union-bag-2026-27",
      "union-rec-annex9-2026-27",
      "pmd-retail-2026-09-10",
      "ppac-fuel-2026-09-10",
      "mospi-cpi-2026-07",
      "mospi-cpi-2024-weights",
      "desk-median",
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
    assert.equal(jurisdictions.find((j) => j.slug === "karnataka")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "kerala")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "odisha")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "andhra-pradesh")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "uttarakhand")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "himachal-pradesh")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "assam")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "chhattisgarh")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "jharkhand")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "goa")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "tripura")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "meghalaya")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "manipur")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "nagaland")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "mizoram")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "arunachal-pradesh")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "sikkim")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "punjab")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "haryana")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "madhya-pradesh")?.tier, "index");
    assert.equal(jurisdictions.find((j) => j.slug === "bihar")?.tier, "gold");
    assert.equal(jurisdictions.find((j) => j.slug === "rajasthan")?.tier, "gold");
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

  it("Karnataka Expenditure Volume-1 isolates 2055+4055 from Demand 05 Home", () => {
    const run = ka2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = ka4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = kaFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const district = ka109.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = kaDemand05Home.amounts[0];
    assert.equal(run.rupees, 120_944_194_000);
    assert.equal(cap.rupees, 4_530_000_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(district.rupees, 89_570_248_000);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 11461);
  });

  it("Kerala AFS isolates 2055+4055 from Demand XII", () => {
    const run = kl2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = kl4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = klFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const actual = kl2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 65_795_289_000);
    assert.equal(cap.rupees, 546_000_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 45_097_484_486);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 5098);
  });

  it("Andhra Pradesh AFS isolates statewide 2055+4055, not one HoD, not Demand X", () => {
    const run = ap2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = ap4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = apFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = apDemandX.amounts[0];
    const actual = ap2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 82_722_346_000);
    assert.equal(cap.rupees, 2_948_591_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 75_115_868_000);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 7874);
    assert.notEqual(Math.round(run.crore), 5557);
  });

  it("Punjab AFS isolates 2055; Demand 12 DGP isolates 4055 from Jails 4055", () => {
    const run = pb2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = pb4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = pbFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const actual = pb2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 84_526_468_000);
    assert.equal(cap.rupees, 4_676_668_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 81_583_140_000);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 9269);
    assert.notEqual(cap.rupees, 7_614_480_000);
  });

  it("Haryana AFS isolates statewide 2055+4055", () => {
    const run = hr2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = hr4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = hrFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const actual = hr2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 74_845_100_000);
    assert.equal(cap.rupees, 2_200_100_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 63_834_872_000);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 7588);
  });

  it("Uttarakhand AFS isolates statewide 2055+4055 from Grant 10 Police and Jail", () => {
    const run = uk2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = uk4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = ukFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = ukGrant10.amounts[0];
    const actual = uk2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 30_921_777_000);
    assert.equal(cap.rupees, 2_555_076_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 24_448_825_000);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 2856);
  });

  it("Tripura AFS isolates statewide 2055 net + 4055", () => {
    const run = tr2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = tr4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = trFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 26_221_492_000);
    assert.equal(cap.rupees, 707_209_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 2297);
  });

  it("Meghalaya AFS isolates 2055 voted+charged + 4055", () => {
    const run = ml2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = ml4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = mlFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 13_586_067_000);
    assert.equal(cap.rupees, 457_370_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 1392);
  });

  it("Manipur AFS isolates 2055+4055, not Demand 07", () => {
    const run = mn2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = mn4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = mnFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = mnDemand07.amounts[0];
    assert.equal(run.rupees, 26_806_424_000);
    assert.equal(cap.rupees, 580_981_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 3209);
  });

  it("Nagaland AFS isolates 2055+4055", () => {
    const run = nl2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = nl4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = nlFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 21_188_982_000);
    assert.equal(cap.rupees, 191_401_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 1987);
  });

  it("Mizoram AFS isolates 2055+4055", () => {
    const run = mz2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = mz4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = mzFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 7_805_772_000);
    assert.equal(cap.rupees, 5_010_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 753);
  });

  it("Arunachal Pradesh AFS isolates 2055+4055", () => {
    const run = ar2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = ar4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = arFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, 19_819_718_000);
    assert.equal(cap.rupees, 290_786_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 3075);
  });

  it("Odisha Demand 01 isolates 2055; 4055 is not a major head", () => {
    const run = od2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const prior = od2055.amounts.find((a) => a.fiscalYear === "2025-26" && a.series === "be")!;
    const hero = odFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = odDemand01.amounts[0];
    assert.equal(run.rupees, 71_009_420_000);
    assert.equal(Math.round(prior.crore), 6831);
    assert.equal(hero.rupees, run.rupees);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
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

  it("Assam AFS isolates statewide 2055+4055", () => {
    const run = as2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = as4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = asFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(run.rupees, Math.round(678510.95 * 100_000));
    assert.equal(cap.rupees, Math.round(35461.17 * 100_000));
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 7170);
  });

  it("Chhattisgarh AFS isolates 2055+4055 from mixed Home Book 02", () => {
    const run = cg2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = cg4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = cgFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = cgDemand02.amounts[0];
    assert.equal(run.rupees, 72_400_061_000);
    assert.equal(cap.rupees, 6_606_140_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 7897);
  });

  it("Jharkhand AFS isolates 2055+4055 from mixed Demand 22 Home", () => {
    const run = jh2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = jh4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = jhFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = jhDemand22.amounts[0];
    assert.equal(run.rupees, Math.round(772604.67 * 100_000));
    assert.equal(cap.rupees, Math.round(56500 * 100_000));
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 7396);
  });

  it("Goa AFS isolates statewide 2055+4055 from mixed Demand 17", () => {
    const run = ga2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = ga4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = gaFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = gaDemand17.amounts[0];
    assert.equal(run.rupees, Math.round(100878.45 * 100_000));
    assert.equal(cap.rupees, Math.round(5595.05 * 100_000));
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.ok(mixed.crore > cap.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 1042);
  });

  it("Sikkim AFS isolates statewide 2055+4055, not a research-summary sector slice", () => {
    const run = sk2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = sk4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = skFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const actual = sk2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 6_294_436_000);
    assert.equal(cap.rupees, 203_149_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 5_771_230_000);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(hero.crore, 650);
    assert.notEqual(Math.round(hero.crore), 633);
  });

  it("Rajasthan Vol2b+Vol3a isolate 2055+4055 वृहद योग, not glance 556, not Demand 18", () => {
    const run = rj2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = rj4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = rjFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = rjDemand18.amounts[0];
    const actual = rj2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, 113_796_474_000);
    assert.equal(cap.rupees, 3_490_014_000);
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, 90_728_045_000);
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(Math.round(hero.crore), 556);
    assert.notEqual(hero.crore, 11729);
    assert.notEqual(Math.round(hero.crore), 11125);
  });

  it("Himachal Pradesh AFS isolates statewide 2055+4055 from mixed Demand 07", () => {
    const run = hp2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = hp4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = hpFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = hpDemand07.amounts[0];
    const actual = hp2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, Math.round(162088.85 * 100_000));
    assert.equal(cap.rupees, Math.round(514.0 * 100_000));
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, Math.round(155346.25 * 100_000));
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(hero.crore, 1626);
    assert.notEqual(Math.round(hero.crore), 1643);
  });

  it("Bihar AFS isolates statewide 2055+4055 from mixed Demand 22", () => {
    const run = br2055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const cap = br4055.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const hero = brFunctional.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    const mixed = brDemand22.amounts[0];
    const actual = br2055.amounts.find((a) => a.fiscalYear === "2024-25" && a.series === "actual")!;
    assert.equal(run.rupees, Math.round(1567106.81 * 100_000));
    assert.equal(cap.rupees, Math.round(116897.17 * 100_000));
    assert.equal(hero.rupees, run.rupees + cap.rupees);
    assert.equal(actual.rupees, Math.round(1109665.32 * 100_000));
    assert.ok(mixed.crore > hero.crore);
    assert.ok(!hero.citationId.startsWith("prs-"));
    assert.notEqual(hero.crore, 16840);
    assert.notEqual(Math.round(hero.crore), 14653);
  });

  it("Union Budget at a Glance total is not Demand 51", () => {
    const total = unionTotalExpenditure.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    )!;
    const rev = unionRevenueExpenditure.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    )!;
    const cap = unionCapitalExpenditure.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    )!;
    const d51 = demand51Net.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.equal(total.crore, 5347315);
    assert.equal(rev.crore + cap.crore, total.crore);
    assert.ok(total.crore > d51.crore);
    const debt = unionOutstandingLiabilities.amounts.find(
      (a) => a.fiscalYear === "2026-27" && a.series === "be",
    )!;
    assert.equal(debt.crore, 21482050);
    assert.ok(debt.crore > total.crore);
    assert.ok(!debt.citationId.startsWith("prs-"));
    assert.equal(LAYERS.length, 4);
    assert.equal(LAYERS.filter((l) => l.empty).length, 0);
  });

  it("compare resolver uses cited GOLD only", () => {
    const mh = resolveSide("maharashtra")!;
    const up = resolveSide("uttar-pradesh")!;
    const ka = resolveSide("karnataka")!;
    assert.equal(mh.tier, "gold");
    assert.equal(up.tier, "gold");
    assert.equal(ka.tier, "gold");
    assert.ok(ka.bag["police-functional"]);
    assert.ok(!ka.bag["police-functional"]!.amounts[0].citationId.startsWith("prs-"));
    const rows = compareRows(mh, up, "2026-27", "be");
    const functional = rows.find((r) => r.field.id === "police-functional")!;
    assert.ok(functional.left && functional.right && functional.mid);
    assert.ok(!functional.left.citationId.startsWith("prs-"));
    assert.ok(!functional.right.citationId.startsWith("prs-"));
    assert.ok(functional.mid.money.citationId.startsWith("desk-median"));
    const run = rows.find((r) => r.field.id === "2055")!;
    assert.ok(run.left && run.right);
    const salaries = rows.find((r) => r.field.id === "obj-01");
    assert.ok(salaries?.right);
    assert.equal(salaries?.left, undefined);
    const years = intersectYears(mh, up);
    assert.ok(years.some((y) => y.fiscalYear === "2026-27" && y.series === "be"));
    const civic = resolveSide("municipal")!;
    assert.equal(civic.tier, "empty");
    const ghmc = resolveSide("ghmc")!;
    assert.equal(ghmc.tier, "gold");
    assert.equal(ghmc.bag["civic-total"], ghmcTotal);
    assert.equal(resolveSide("bmc")!.tier, "gold");
    const gram = resolveSide("telangana-gram")!;
    assert.equal(gram.tier, "gold");
    assert.equal(gram.bag["2515"], tg2515);
    const tg = resolveSide("telangana")!;
    assert.equal(tg.bag["health-functional"], tgHealthFunctional);
    assert.equal(tg.bag["police-functional"], tgObject010);
  });
});

type Amt = { fiscalYear: string; series: string; rupees: number; crore: number; citationId: string };
const pickAmt = (item: { amounts: Amt[] }, fy: string, series: string) =>
  item.amounts.find((a) => a.fiscalYear === fy && a.series === series)!;

describe("Telangana Health - AFS 2210 + 2211 + 4210 + 4211", () => {
  const be = (item: { amounts: Amt[] }) => pickAmt(item, "2026-27", "be");

  it("types the printed lakhs and matches the printed Total (b) rows", () => {
    assert.equal(be(tg2210).rupees, 96_900_135_000);
    assert.equal(be(tg2211).rupees, 23_591_285_000);
    assert.equal(be(tgHealthRun).rupees, 120_491_420_000);
    assert.equal(be(tg4210).rupees, 18_558_933_000);
    assert.equal(be(tg4211).rupees, 920_400_000);
    assert.equal(be(tgHealthCap).rupees, 19_479_333_000);
    assert.equal(be(tgHealthCap).rupees, be(tg4210).rupees + be(tg4211).rupees);
    assert.equal(
      pickAmt(tgHealthCap, "2024-25", "actual").rupees,
      pickAmt(tg4210, "2024-25", "actual").rupees + pickAmt(tg4211, "2024-25", "actual").rupees,
    );
    assert.equal(be(tgHealthFunctional).rupees, be(tgHealthRun).rupees + be(tgHealthCap).rupees);
    assert.equal(Math.round(be(tgHealthFunctional).crore * 100) / 100, 13997.08);
    assert.ok(!be(tgHealthFunctional).citationId.startsWith("prs-"));
  });

  it("does not type 4211 for the two 2025-26 columns printed as dots", () => {
    assert.equal(tg4211.amounts.find((a) => a.fiscalYear === "2025-26"), undefined);
  });

  it("keeps the department total apart from the head total", () => {
    assert.equal(be(tgHealthDepartment).crore, 13679);
    assert.ok(be(tgHealthDepartment).crore < be(tgHealthFunctional).crore);
    assert.notEqual(be(tgHealthDepartment).citationId, be(tgHealthFunctional).citationId);
  });

  it("leaves Telangana Police untouched", () => {
    assert.equal(be(tgObject010).crore, 8852.93);
  });
});

describe("Telangana villages - AFS 2515 + 4515", () => {
  const be = (item: { amounts: Amt[] }) => pickAmt(item, "2026-27", "be");

  it("types the printed lakhs and matches the printed rural Total (b)", () => {
    assert.equal(be(tg2515).rupees, 62_273_905_000);
    assert.equal(be(tg4515).rupees, 31_582_320_000);
    assert.equal(be(tgGramFunctional).rupees, be(tg2515).rupees + be(tg4515).rupees);
    assert.equal(Math.round(be(tgGramFunctional).crore * 100) / 100, 9385.62);
    assert.equal(be(tgRuralRevenueTotal).rupees, 77_641_246_000);
    assert.equal(pickAmt(tgRuralRevenueTotal, "2024-25", "actual").rupees, 31_061_879_000);
    assert.equal(be(tg2501).rupees + be(tg2506).rupees + be(tg2515).rupees, be(tgRuralRevenueTotal).rupees);
  });

  it("keeps the PR&RD department total apart", () => {
    assert.equal(be(tgPrrdDepartment).crore, 33688);
    assert.ok(be(tgPrrdDepartment).crore > be(tgGramFunctional).crore);
  });
});

describe("GHMC - Budget Estimates 2025-26", () => {
  it("budget size equals revenue + capital for every estimate column", () => {
    for (const [fy, series] of [["2024-25", "be"], ["2024-25", "re"], ["2025-26", "be"]] as const) {
      assert.equal(
        pickAmt(ghmcTotal, fy, series).rupees,
        pickAmt(ghmcRevenue, fy, series).rupees + pickAmt(ghmcCapital, fy, series).rupees,
      );
    }
    assert.equal(pickAmt(ghmcTotal, "2025-26", "be").crore, 8440);
    assert.equal(pickAmt(ghmcRevenue, "2025-26", "be").crore, 4000);
    assert.equal(pickAmt(ghmcCapital, "2025-26", "be").crore, 4440);
  });

  it("keeps the printed 2023-24 actual even though its parts differ by 1.70 crore", () => {
    assert.equal(pickAmt(ghmcTotal, "2023-24", "actual").crore, 7119);
    const parts = pickAmt(ghmcRevenue, "2023-24", "actual").crore + pickAmt(ghmcCapital, "2023-24", "actual").crore;
    assert.equal(Math.round(parts * 100) / 100, 7120.7);
  });

  it("has no 2026-27 rupee and says why", () => {
    assert.equal(ghmcTotal.amounts.find((a) => a.fiscalYear === "2026-27"), undefined);
    const ghmc = municipalBodies.find((m) => m.slug === "ghmc")!;
    assert.ok(ghmc.missingYears.some((g) => g.fiscalYear === "2026-27"));
    const bmc = municipalBodies.find((m) => m.slug === "bmc")!;
    assert.equal(bmc.tier, "gold");
    assert.equal(pickAmt(bmc.total!, "2026-27", "be").crore, 80862.72);
    assert.equal(pickAmt(bmc.revenue!, "2026-27", "be").rupees + pickAmt(bmc.capital!, "2026-27", "be").rupees, pickAmt(bmc.total!, "2026-27", "be").rupees);
    assert.equal(bmc.total!.amounts.length, 1);
  });
});

describe("State Health books — AFS 2210 + 2211 + 4210 + 4211", () => {
  const be = (item: { amounts: Amt[] }) => pickAmt(item, "2026-27", "be");

  it("every book has a living citation, four columns, and reconciles to its printed totals", () => {
    for (const b of healthBooks) {
      assert.equal(getJurisdiction(b.slug)?.heads?.health, "gold", b.slug);
      for (const item of [b.run2210, b.run2211, b.cap4210, b.run, b.cap, b.functional]) {
        for (const m of item.amounts) {
          const c = getCitation(m.citationId);
          assert.ok(c.url.startsWith("https://"), `${b.slug} ${item.id}`);
          assert.ok(!m.citationId.startsWith("prs-"));
          assert.ok(m.rupees > 0, `${b.slug} ${item.id} ${m.fiscalYear} ${m.series}`);
        }
        assert.equal(item.amounts.length, 4, `${b.slug} ${item.id} should print four columns`);
      }
      assert.equal(be(b.functional).rupees, be(b.run).rupees + be(b.cap).rupees, b.slug);
      assert.equal(be(b.run).rupees, be(b.run2210).rupees + be(b.run2211).rupees, b.slug);
      // Printed totals may round their own parts by a rupee or two (Tripura prints 4 decimals of a lakh).
      for (const t of b.printedRunTotal ?? []) {
        const got = pickAmt(b.run, t.fiscalYear, t.series).rupees;
        assert.ok(Math.abs(got - t.rupees) <= 100, `${b.slug} run ${t.fiscalYear} ${t.series}: ${got} vs printed ${t.rupees}`);
      }
      for (const t of b.printedCapTotal ?? []) {
        const got = pickAmt(b.cap, t.fiscalYear, t.series).rupees;
        assert.ok(Math.abs(got - t.rupees) <= 100, `${b.slug} cap ${t.fiscalYear} ${t.series}: ${got} vs printed ${t.rupees}`);
      }
      const side = resolveSide(b.slug)!;
      assert.equal(side.bag["health-functional"], b.functional, b.slug);
    }
  });

  it("locks spot values read off the page images", () => {
    const g = (slug: string) => healthBooks.find((b) => b.slug === slug)!;
    assert.equal(be(g("kerala").run2210).rupees, 123_239_786_000);
    assert.equal(pickAmt(g("kerala").run2210, "2024-25", "actual").rupees, 96_313_044_469);
    assert.equal(be(g("andhra-pradesh").functional).rupees, 165_643_129_000 + 30_656_519_000);
    assert.equal(be(g("punjab").run2210).rupees, 71_068_454_000);
    assert.equal(be(g("haryana").cap4210).rupees, 29_779_400_000);
    assert.equal(be(g("meghalaya").run2211).rupees, 1_225_421_000);
    assert.equal(be(g("chhattisgarh").cap).rupees, 16_555_354_000);
    assert.equal(be(g("assam").run).rupees, 69_925_453_000);
    assert.equal(be(g("tripura").cap).rupees, 1_949_823_000);
    assert.equal(be(g("nagaland").functional).crore, Math.round((67304.88 + 5200 + 23188.67) * 100_000) / 10_000_000);
    assert.equal(g("kerala").cap4211, undefined);
    assert.equal(g("uttarakhand").cap4211!.amounts.length, 2);
  });

  it("does not open a health door for states without a book", () => {
    for (const j of jurisdictions) {
      if (j.slug === "telangana" || healthBooks.some((b) => b.slug === j.slug)) continue;
      assert.notEqual(j.heads?.health, "gold", j.slug);
      assert.equal(resolveSide(j.slug)?.bag["health-functional"], undefined, j.slug);
    }
  });
});

describe("Union Territory police — MHA Detailed Demands for Grants 2026-27", () => {
  it("five UTs are GOLD from their own demand, cited, and reconcile", () => {
    assert.equal(utPoliceBooks.length, 5);
    for (const b of utPoliceBooks) {
      const j = getJurisdiction(b.slug)!;
      assert.equal(j.kind, "ut", b.slug);
      assert.equal(j.tier, "gold", b.slug);
      for (const item of [b.run2055, b.cap4055, b.functional]) {
        assert.equal(item.amounts.length, 4);
        for (const m of item.amounts) {
          assert.ok(getCitation(m.citationId).url.startsWith("https://www.mha.gov.in/"), b.slug);
          assert.ok(m.rupees > 0);
        }
      }
      const be = pickAmt(b.functional, "2026-27", "be");
      assert.equal(be.rupees, pickAmt(b.run2055, "2026-27", "be").rupees + pickAmt(b.cap4055, "2026-27", "be").rupees);
      const side = resolveSide(b.slug)!;
      assert.equal(side.tier, "gold");
      assert.equal(side.entity.layer, "union");
      assert.equal(side.bag["police-functional"], b.functional);
    }
  });

  it("locks the printed totals read off the page images (₹ thousands)", () => {
    const g = (slug: string) => utPoliceBooks.find((b) => b.slug === slug)!;
    assert.equal(pickAmt(g("andaman-and-nicobar-islands").run2055, "2026-27", "be").rupees, 5_378_400_000);
    assert.equal(pickAmt(g("andaman-and-nicobar-islands").cap4055, "2024-25", "actual").rupees, 142_536_000);
    assert.equal(pickAmt(g("chandigarh").run2055, "2026-27", "be").rupees, 8_929_800_000);
    assert.equal(pickAmt(g("chandigarh").cap4055, "2025-26", "be").rupees, 832_600_000);
    assert.equal(pickAmt(g("dadra-and-nagar-haveli-and-daman-and-diu").functional, "2026-27", "be").rupees, 1_197_700_000 + 220_600_000);
    assert.equal(pickAmt(g("ladakh").run2055, "2025-26", "re").rupees, 2_565_300_000);
    assert.equal(pickAmt(g("lakshadweep").cap4055, "2026-27", "be").rupees, 35_300_000);
  });

  it("keeps Delhi, J&K and Puducherry off the police ledger", () => {
    for (const slug of ["delhi", "jammu-and-kashmir", "puducherry"]) {
      assert.notEqual(getJurisdiction(slug)?.tier, "gold", slug);
    }
  });
});
