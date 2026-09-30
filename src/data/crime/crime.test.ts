import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { perLakhPeople, sharePercent } from "./format.ts";
import { rapePlaces } from "./rapePlaces.ts";
import { ncrb2022 } from "./ncrb2022.ts";
import { ncrb2023 } from "./ncrb2023.ts";
import { ncrb2023Rape } from "./ncrb2023Rape.ts";
import { ncrb2023More } from "./ncrb2023More.ts";
import { ncrb2024More, ncrb2024Rape } from "./ncrb2024.ts";
import { rapeSeries } from "./rapeSeries.ts";
import { murderSeries, propertySeries } from "./decadeSeries.ts";
import { composition2024 as k } from "./composition.ts";
import { ftsc, karnatakaCheck, keralaCheck, ncwComplaints, nhrcCustody } from "./govRecords.ts";
import { citations } from "../sources.ts";

describe("NCRB crime tables", () => {
  it("sums every state and UT to the Bureau's all-India cases", () => {
    const sum = (pick: (row: (typeof ncrb2022.states)[number]) => number) =>
      ncrb2022.states.reduce((total, row) => total + pick(row), 0);
    assert.equal(ncrb2022.states.length, 36);
    assert.equal(ncrb2022.cities.length, 19);
    assert.equal(sum((row) => row.murder.y2022), 28522);
    assert.equal(sum((row) => row.rape.cases), 31516);
    assert.equal(sum((row) => row.theft.cases), 652731);
    assert.equal(sum((row) => row.burglary.cases), 107222);
    assert.equal(sum((row) => row.robbery.cases), 28356);
    assert.equal(sum((row) => row.dacoity.cases), 2666);
    assert.equal(
      ncrb2022.cities.reduce((total, row) => total + row.theft.cases, 0),
      ncrb2022.cityTotals.theft,
    );
  });

  it("keeps the rape rate on the women's denominator", () => {
    assert.equal(ncrb2022.women.rapeRate, 4.7);
    assert.equal(ncrb2022.populationLakh, 13797.5);
    const impliedWomenLakh = 31516 / ncrb2022.women.rapeRate;
    assert.ok(Math.abs(impliedWomenLakh - 6705.5) < 0.2);
    assert.ok(impliedWomenLakh < ncrb2022.populationLakh / 2);
    assert.equal(sharePercent(ncrb2022.women.rape, ncrb2022.women.total), 7.1);
    assert.equal(sharePercent(ncrb2022.women.cruelty, ncrb2022.women.total), 31.4);
  });

  it("locks the rankings that the pages lead with", () => {
    const rajasthan = ncrb2022.states.find((row) => row.name === "Rajasthan");
    const uttarakhand = ncrb2022.states.find((row) => row.name === "Uttarakhand");
    const delhi = ncrb2022.states.find((row) => row.name === "Delhi");
    assert.equal(rajasthan?.rape.cases, 5399);
    assert.equal(rajasthan?.rape.girlsUnder18, 0);
    assert.equal(uttarakhand?.rape.ratePerLakhWomen, 15.4);
    assert.equal(delhi?.theft.cases, 206650);
    assert.equal(perLakhPeople(5399, 804.4), 6.7);
    assert.equal(
      ncrb2022.motives.reduce((total, row) => total + row.cases, 0),
      28522,
    );
    assert.equal(ncrb2022.rapeRelation.known + ncrb2022.rapeRelation.unknown, 31516);
    assert.equal(ncrb2023.murder.priorYearCases, 28522);
    assert.equal(ncrb2023.theft.priorYearCases, 652731);
    assert.equal(ncrb2023.women.priorYearCases, 445256);
  });

  it("plots district rape counts that add toward the national total", () => {
    assert.equal(rapePlaces.totalCases, 31516);
    assert.equal(
      rapePlaces.places.reduce((sum, place) => sum + place.cases, 0),
      rapePlaces.plottedCases,
    );
    assert.ok(rapePlaces.plottedCases > 30000);
    assert.equal(rapePlaces.places.find((place) => place.name === "Mumbai Commr.")?.cases, 370);
    assert.ok(rapePlaces.places.every((place) => place.lat > 6 && place.lat < 37 && place.lon > 67 && place.lon < 98));
  });

  it("sums 2023 rape rows to the Bureau's printed totals", () => {
    const r = ncrb2023Rape;
    const sum = <T,>(rows: readonly T[], pick: (row: T) => number) => rows.reduce((t, row) => t + pick(row), 0);
    assert.equal(r.states.length, 36);
    assert.equal(r.cities.length, 19);
    assert.equal(sum(r.states, (row) => row.rape), r.national.rape);
    assert.equal(r.national.rape, 29670);
    assert.equal(sum(r.states, (row) => row.childRapePocso), r.national.childRapePocso);
    // State rows hold cases (col. 69, 849); the national line holds victims (col. 70, 852).
    assert.equal(sum(r.states, (row) => row.girlsUnder18), 849);
    assert.equal(sum(r.states, (row) => row.known), r.relation.known);
    assert.equal(sum(r.states, (row) => row.unknown), r.relation.unknown);
    assert.equal(sum(r.cities, (row) => row.rape), 3606);
    assert.equal(sum(r.cities, (row) => row.childRapePocso), 4321);
    for (const row of r.states) assert.equal(row.known + row.unknown, row.rape, row.name);
    for (const row of r.states) assert.ok(ncrb2022.states.some((old) => old.name === row.name), row.name);
    for (const row of r.cities) assert.ok(ncrb2022.cities.some((old) => old.name === row.name), row.name);
  });

  it("keeps the 2023 rape series joined to the 2022 book", () => {
    const r = ncrb2023Rape;
    assert.equal(r.series.find((row) => row.year === 2022)?.rape, ncrb2022.women.rape);
    assert.equal(r.series.find((row) => row.year === 2021)?.rape, ncrb2022.trends.rape.y2021.cases);
    assert.equal(r.court.rape.forTrial, ncrb2023.disposal.rape.forTrial);
    assert.equal(r.court.rape.convicted, ncrb2023.disposal.rape.convicted);
    assert.equal(r.police.forInvestigation, ncrb2023.disposal.rape.forInvestigation);
    assert.equal(r.police.pendingFromPriorYear, ncrb2022.police.rape.pendingAtYearEnd);
    assert.equal(r.court.rape.pendingFromPriorYear, ncrb2022.court.rape.pendingAtYearEnd);
    assert.equal(sharePercent(r.police.finalReportFalse, r.police.disposedByPolice), 12.9);
    assert.equal(r.national.rape + r.national.childRapePocso, 69716);
  });

  it("sums 2023 murder and property rows to Table 1.2", () => {
    const m = ncrb2023More;
    const sum = (pick: (row: (typeof m.states)[number]) => number) => m.states.reduce((t, row) => t + pick(row), 0);
    assert.equal(m.states.length, 36);
    assert.equal(m.cities.length, 19);
    assert.equal(sum((row) => row.murder.y2023), m.national.murder.y2023.cases);
    assert.equal(sum((row) => row.murder.y2022), ncrb2022.trends.murder.y2022.cases);
    assert.equal(sum((row) => row.theft.cases), m.national.theft.y2023.cases);
    assert.equal(sum((row) => row.burglary.cases), m.national.burglary.y2023.cases);
    assert.equal(sum((row) => row.robbery.cases), m.national.robbery.y2023.cases);
    assert.equal(sum((row) => row.dacoity.cases), m.national.dacoity.y2023.cases);
    assert.equal(m.national.murder.y2023.cases, ncrb2023.murder.cases);
    assert.equal(m.national.theft.y2023.cases, ncrb2023.theft.cases);
    assert.equal(m.national.rape.y2023.cases, ncrb2023Rape.national.rape);
    for (const key of ["murder", "rape", "theft", "burglary", "robbery", "dacoity"] as const) {
      assert.equal(m.national[key].y2022.cases, ncrb2022.trends[key].y2022.cases, key);
      assert.equal(m.national[key].y2021.cases, ncrb2022.trends[key].y2021.cases, key);
    }
    assert.equal(m.murderMotives.reduce((t, row) => t + row.cases, 0), m.national.murder.y2023.cases);
    assert.equal(m.murderVictims.male + m.murderVictims.female + m.murderVictims.transgender, m.murderVictims.total);
    for (const row of m.states) assert.ok(ncrb2022.states.some((old) => old.name === row.name), row.name);
  });

  it("joins the ten-year rape series to the tables already checked", () => {
    const y = (n: number) => rapeSeries.find((r) => r.year === n)!;
    assert.deepEqual(rapeSeries.map((r) => r.year), [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    assert.equal(y(2020).s376, ncrb2022.trends.rape.y2020.cases);
    assert.equal(y(2021).s376, ncrb2022.trends.rape.y2021.cases);
    assert.equal(y(2022).s376, ncrb2022.women.rape);
    assert.equal(y(2022).pocsoGirls, ncrb2022.women.pocsoPenetrative);
    assert.equal(y(2023).s376, ncrb2023Rape.national.rape);
    assert.equal(y(2023).pocsoGirls, ncrb2023Rape.national.childRapePocso);
    assert.equal(y(2023).gangRape, ncrb2023Rape.sectionWise.gangRape376D);
    for (const r of rapeSeries) {
      if (r.gangRape != null) assert.ok(r.gangRape < r.s376, String(r.year));
      assert.equal(r.pocsoInside, r.year < 2017, String(r.year));
      assert.equal(r.pocsoGirls == null, r.pocsoInside, String(r.year));
    }
  });

  it("joins the ten-year murder and property series to the tables already checked", () => {
    const m = (y: number) => murderSeries.find((r) => r.year === y)!;
    const p = (y: number) => propertySeries.find((r) => r.year === y)!;
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    assert.deepEqual(murderSeries.map((r) => r.year), years);
    assert.deepEqual(propertySeries.map((r) => r.year), years);
    assert.equal(m(2020).cases, ncrb2022.trends.murder.y2020.cases);
    for (const y of [2021, 2022, 2023] as const) {
      const n = ncrb2023More.national;
      const key = `y${y}` as const;
      assert.equal(m(y).cases, n.murder[key].cases);
      assert.equal(p(y).vehicleTheft + p(y).otherTheft, n.theft[key].cases);
      assert.equal(p(y).vehicleTheft, n.autoTheft[key].cases);
      assert.equal(p(y).burglary, n.burglary[key].cases);
      assert.equal(p(y).robbery, n.robbery[key].cases);
      assert.equal(p(y).dacoity, n.dacoity[key].cases);
    }
    const mot = (label: string) => ncrb2022.motives.find((x) => x.label === label)!.cases;
    assert.equal(m(2022).motives!.gain, mot("Gain"));
    assert.equal(m(2022).motives!.vendetta, mot("Personal vendetta or enmity"));
    assert.equal(m(2022).motives!.disputes, mot("Disputes"));
    const mot23 = (label: string) => ncrb2023More.murderMotives.find((x) => x.label === label)!.cases;
    assert.equal(m(2023).motives!.disputes, mot23("Disputes"));
    assert.equal(m(2023).motives!.loveOrIllicit, mot23("Love affairs") + mot23("Illicit relationship"));
    for (const r of murderSeries) {
      assert.equal(r.motives == null, r.year < 2017, String(r.year));
      if (r.motives) {
        const named = r.motives.disputes + r.motives.vendetta + r.motives.loveOrIllicit + r.motives.gain;
        assert.ok(named < r.cases, String(r.year));
      }
    }
  });

  it("adds the 2024 parts up to the printed totals", () => {
    const sum = (o: Record<string, number>, skip: string[] = []) => Object.entries(o).filter(([key]) => !skip.includes(key)).reduce((t, [, v]) => t + v, 0);
    assert.equal(sum(k.rape.relation, ["total"]), k.rape.relation.total);
    assert.equal(k.rape.relation.total, k.rape.s376);
    assert.equal(sum(k.rape.pocsoRelation, ["total"]), k.rape.pocsoRelation.total);
    assert.equal(sum(k.theft, ["total"]), k.theft.total);
    assert.ok(sum(k.murder.motives) < k.murder.cases);
    const y24 = rapeSeries.find((r) => r.year === 2024)!;
    assert.equal(k.rape.s376, y24.s376);
    assert.equal(k.rape.gangRape, y24.gangRape);
    assert.equal(k.rape.pocsoGirls, y24.pocsoGirls);
    const m24 = murderSeries.find((r) => r.year === 2024)!;
    assert.equal(k.murder.cases, m24.cases);
    assert.equal(k.murder.motives.disputes, m24.motives!.disputes);
    assert.equal(k.murder.motives.loveAffairs + k.murder.motives.illicit, m24.motives!.loveOrIllicit);
    const p24 = propertySeries.find((r) => r.year === 2024)!;
    assert.equal(k.theft.vehicle, p24.vehicleTheft);
    assert.equal(k.theft.total - k.theft.vehicle, p24.otherTheft);
    assert.equal(k.robbery.robbery, p24.robbery);
    assert.equal(k.robbery.dacoity, p24.dacoity);
  });

  it("keeps the other government records consistent and cited", () => {
    assert.equal(ftsc.pendencyByState.reduce((t, [, v]) => t + v, 0), ftsc.pendencyTotal);
    assert.equal(Math.round((ftsc.year2024.disposed / ftsc.year2024.instituted) * 10000) / 100, 96.28);
    const kl = (head: string, year: number) => keralaCheck.rows.find((r) => r.head === head && r.year === year)!;
    const k22 = ncrb2022.states.find((x) => x.name === "Kerala")!;
    const k23 = ncrb2023Rape.states.find((x) => x.name === "Kerala")!;
    const m23 = ncrb2023More.states.find((x) => x.name === "Kerala")!;
    assert.equal(kl("Rape", 2023).ncrb, k23.rape + k23.childRapePocso);
    assert.equal(kl("Rape", 2022).ncrb - 1704, k22.rape.cases);
    assert.equal(kl("Murder", 2022).ncrb, k22.murder.y2022);
    assert.equal(kl("Murder", 2023).ncrb, m23.murder.y2023);
    assert.equal(kl("Theft", 2023).ncrb, m23.theft.cases);
    assert.equal(kl("Robbery", 2023).ncrb, m23.robbery.cases);
    assert.equal(kl("Dacoity", 2023).ncrb, m23.dacoity.cases);
    assert.deepEqual(ncwComplaints.years.map((y) => y.year), [2019, 2020, 2021, 2022, 2023, 2024, 2025]);
    const ids = [ftsc.asOn2025_06_30.source, ftsc.year2024.source, ftsc.pendencySource, ncwComplaints.source, nhrcCustody.policeCustodyDeaths.source, nhrcCustody.allCustodialDeaths.source, keralaCheck.source, ...keralaCheck.rows.map((r) => r.ncrbSource)];
    for (const id of ids) {
      assert.ok(citations[id], id);
      assert.match(new URL(citations[id]!.url).hostname, /(\.gov\.in|\.nic\.in)$/, id);
    }
  });

  it("sums 2024 rows to the Bureau's totals and agrees with the 2023 book", () => {
    const r = ncrb2024Rape;
    const m = ncrb2024More;
    const sum = <T,>(rows: readonly T[], f: (x: T) => number) => rows.reduce((t, x) => t + f(x), 0);
    assert.equal(r.states.length, 36);
    assert.equal(sum(r.states, (x) => x.rape), r.national.rape);
    assert.equal(sum(r.states, (x) => x.childRapePocso), r.national.childRapePocso);
    assert.equal(sum(r.states, (x) => x.girlsUnder18), r.national.girlCasesUnder18);
    assert.equal(r.national.rape, 29536);
    assert.equal(r.national.childRapePocso, 43313);
    for (const x of r.states) assert.equal(x.known + x.unknown, x.rape, x.name);
    for (const key of ["murder", "theft", "burglary", "robbery", "dacoity"] as const) {
      const pick = (x: (typeof m.states)[number]) => (key === "murder" ? x.murder.y2024 : x[key].cases);
      assert.equal(sum(m.states, pick), m.national[key].y2024.cases, key);
      // the 2024 volume reprints 2023 and 2022; they must match what those volumes printed
      assert.equal(m.national[key].y2023!.cases, ncrb2023More.national[key].y2023.cases, `${key} 2023`);
      assert.equal(m.national[key].y2022!.cases, ncrb2022.trends[key].y2022.cases, `${key} 2022`);
    }
    for (const x of m.states) {
      const old = ncrb2023More.states.find((o) => o.name === x.name)!;
      assert.equal(x.murder.y2023, old.murder.y2023, x.name);
      assert.equal(x.murder.y2022, old.murder.y2022, x.name);
    }
    assert.equal(m.disposal.rape.convicted, r.court.rape.convicted);
    assert.equal(m.murderMotives.reduce((t, x) => t + x.cases, 0), m.national.murder.y2024.cases);
    assert.equal(m.murderVictims.male + m.murderVictims.female + m.murderVictims.transgender, m.murderVictims.total);
  });

  it("ties the Karnataka cross-check to the Bureau rows it claims to match", () => {
    const pick = (year: number) => ({ 2022: ncrb2022.states, 2023: ncrb2023More.states, 2024: ncrb2024More.states })[year as 2022 | 2023 | 2024];
    for (const r of karnatakaCheck.rows) {
      assert.equal(r.state, r.ncrb, `${r.head} ${r.year}`);
      if (r.head === "Murder") {
        const row = pick(r.year).find((x) => x.name === "Karnataka")! as { murder: Record<string, number> };
        assert.equal(row.murder[`y${r.year}`], r.ncrb, `murder ${r.year}`);
      }
      if (["Theft", "Burglary", "Robbery", "Dacoity"].includes(r.head)) {
        const key = r.head.toLowerCase() as "theft" | "burglary" | "robbery" | "dacoity";
        const row = pick(r.year).find((x) => x.name === "Karnataka")! as unknown as Record<string, { cases: number }>;
        assert.equal(row[key]!.cases, r.ncrb, `${key} ${r.year}`);
      }
    }
    assert.equal(ncrb2024Rape.states.find((x) => x.name === "Karnataka")!.rape, 671);
    assert.equal(ncrb2024Rape.states.find((x) => x.name === "Karnataka")!.childRapePocso, 3269);
  });
});
