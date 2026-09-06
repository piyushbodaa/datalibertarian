import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromCrore } from "../../lib/money.ts";
import { citations, getCitation } from "../sources.ts";
import { functionalPolice } from "../maharashtra-police.ts";
import { commissionerates } from "../telangana/commissionerates.ts";
import {
  compareRows,
  getCompareEntity,
  peersForField,
  resolveSide,
} from "./resolve.ts";
import { medianOf, type PeerHit } from "./median.ts";

function hit(slug: string, crore: number): PeerHit {
  return {
    slug,
    label: slug,
    href: `/${slug}`,
    money: fromCrore(crore, "be", "2026-27", "mh-home-whitebook-2026-27"),
  };
}

const META = {
  fieldId: "police-functional" as const,
  layer: "state" as const,
  series: "be" as const,
  fiscalYear: "2026-27",
  excludePicked: false,
};

describe("desk-median of GOLD compare peers", () => {
  it("desk-median citation exists and is not a government PDF", () => {
    assert.ok(citations["desk-median"]);
    const c = getCitation("desk-median");
    assert.equal(c.publisher, "Data Libertarian desk-median");
    assert.equal(c.short, "Middle of the books");
    assert.match(c.notes ?? "", /Not a printed government total/);
  });

  it("keeps Maharashtra source amounts unchanged", () => {
    const mh = functionalPolice.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
    assert.ok(mh);
    assert.equal(Math.round(mh.crore * 100) / 100, 33116.49);
  });

  it("N = 0 returns null, not 0 crore", () => {
    const empty = medianOf([], META);
    assert.equal(empty, null);
    const civic = peersForField("layer", "municipal", "civic-total", "2026-27", "be");
    assert.equal(civic.length, 0);
    assert.equal(medianOf(civic, { ...META, layer: "municipal", fieldId: "civic-total" }), null);
  });

  it("odd N uses the exact middle Money.rupees", () => {
    const cell = medianOf([hit("a", 10), hit("b", 30), hit("c", 20)], META);
    assert.ok(cell);
    assert.equal(cell.n, 3);
    assert.equal(cell.method, "single");
    assert.deepEqual(cell.midSlugs, ["c"]);
    assert.equal(cell.money.rupees, fromCrore(20, "be", "2026-27", "mh-home-whitebook-2026-27").rupees);
    assert.equal(cell.thin, false);
    assert.ok(cell.money.citationId.startsWith("desk-median"));
    assert.notEqual(cell.money.citationId, hit("c", 20).money.citationId);
  });

  it("even N uses the mean of the two middle rupee values", () => {
    const cell = medianOf([hit("a", 10), hit("b", 40), hit("c", 20), hit("d", 30)], META);
    assert.ok(cell);
    assert.equal(cell.n, 4);
    assert.equal(cell.method, "mid-pair");
    assert.deepEqual(cell.midSlugs, ["c", "d"]);
    const left = fromCrore(20, "be", "2026-27", "mh-home-whitebook-2026-27").rupees;
    const right = fromCrore(30, "be", "2026-27", "mh-home-whitebook-2026-27").rupees;
    assert.equal(cell.money.rupees, Math.round((left + right) / 2));
    assert.ok(cell.thin === false);
  });

  it("does not mutate peer Money objects", () => {
    const peer = hit("a", 12);
    const before = { ...peer.money };
    medianOf([peer, hit("b", 18), hit("c", 15)], META);
    assert.deepEqual(peer.money, before);
  });

  it("uses only tier === gold and never INDEX slugs", () => {
    const peers = peersForField("layer", "state", "police-functional", "2026-27", "be");
    assert.ok(peers.length >= 2);
    for (const p of peers) {
      const side = resolveSide(p.slug);
      assert.equal(side?.tier, "gold");
      assert.ok(!p.money.citationId.startsWith("prs-"));
    }
    assert.ok(peers.some((p) => p.slug === "karnataka"));
    assert.ok(peers.some((p) => p.slug === "andhra-pradesh"));
    assert.ok(!peers.some((p) => p.slug === "rajasthan"));
    const ka = resolveSide("karnataka");
    assert.equal(ka?.tier, "gold");
  });

  it("N matches the resolver count, not a hardcoded 6", () => {
    const peers = peersForField("layer", "state", "police-functional", "2026-27", "be");
    const cell = medianOf(peers, META);
    assert.ok(cell);
    assert.equal(cell.n, peers.length);
    assert.ok(cell.n >= 2);
    for (const p of cell.peers) {
      assert.ok(getCitation(p.money.citationId));
    }
    const cite = getCitation(cell.money.citationId);
    assert.match(cite.publisher, /desk-median/);
    assert.ok(cite.notes?.includes("maharashtra"));
    if (cell.n % 2 === 0) {
      assert.equal(cell.method, "mid-pair");
      assert.equal(cell.midSlugs.length, 2);
      const a = cell.peers[cell.n / 2 - 1];
      const b = cell.peers[cell.n / 2];
      assert.equal(cell.money.rupees, Math.round((a.money.rupees + b.money.rupees) / 2));
    } else {
      assert.equal(cell.method, "single");
      assert.equal(cell.money.rupees, cell.peers[Math.floor((cell.n - 1) / 2)].money.rupees);
    }
  });

  it("exclude=1 drops the two on-screen slugs", () => {
    const all = peersForField("layer", "state", "police-functional", "2026-27", "be");
    const dropped = peersForField("layer", "state", "police-functional", "2026-27", "be", [
      "maharashtra",
      "uttar-pradesh",
    ]);
    assert.ok(all.some((p) => p.slug === "maharashtra"));
    assert.ok(all.some((p) => p.slug === "uttar-pradesh"));
    assert.ok(!dropped.some((p) => p.slug === "maharashtra"));
    assert.ok(!dropped.some((p) => p.slug === "uttar-pradesh"));
    assert.equal(dropped.length, all.length - 2);
    const mh = resolveSide("maharashtra")!;
    const up = resolveSide("uttar-pradesh")!;
    const rows = compareRows(mh, up, "2026-27", "be", { excludePicked: true });
    const mid = rows.find((r) => r.field.id === "police-functional")?.mid;
    assert.ok(mid);
    assert.equal(mid.excludePicked, true);
    assert.ok(!mid.peers.some((p) => p.slug === "maharashtra" || p.slug === "uttar-pradesh"));
  });

  it("compareRows puts a median cell between two GOLD states", () => {
    const mh = resolveSide("maharashtra")!;
    const up = resolveSide("uttar-pradesh")!;
    const rows = compareRows(mh, up, "2026-27", "be");
    const functional = rows.find((r) => r.field.id === "police-functional")!;
    assert.ok(functional.left && functional.mid && functional.right);
    assert.ok(functional.mid.n >= 2);
    assert.ok(functional.mid.money.citationId.startsWith("desk-median"));
    const leftOnly = compareRows(mh, undefined, "2026-27", "be");
    assert.ok(leftOnly.find((r) => r.field.id === "police-functional")?.mid);
  });

  it("station grain with no station LineItems returns null, not a divided total", () => {
    const peers = peersForField("station", "state", "police-functional", "2026-27", "be");
    assert.equal(peers.length, 0);
    const cell = medianOf(peers, { ...META, layer: "station" });
    assert.equal(cell, null);
    const station = resolveSide("bachupally");
    assert.equal(station?.tier, "empty");
    assert.equal(Object.keys(station?.bag ?? {}).length, 0);
    const mh = functionalPolice.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be")!;
    assert.ok(mh.crore > 0);
  });

  it("city-police median is GOLD commissionerates, not Maharashtra 2055", () => {
    const peers = peersForField("city", "state", "police-functional", "2026-27", "be");
    const cpSlugs = new Set<string>(commissionerates.map((c) => c.slug));
    assert.ok(peers.length >= 2);
    assert.ok(peers.every((p) => cpSlugs.has(p.slug)));
    assert.ok(!peers.some((p) => p.slug === "maharashtra"));
    const hyd = resolveSide("hyderabad-city")!;
    const cyber = resolveSide("cyberabad")!;
    const rows = compareRows(hyd, cyber, "2026-27", "be", { grain: "city" });
    const functional = rows.find((r) => r.field.id === "police-functional")!;
    assert.ok(functional.left && functional.right && functional.mid);
    assert.ok(!functional.mid.peers.some((p) => p.slug === "maharashtra"));
    assert.equal(getCompareEntity("mumbai"), undefined);
    assert.equal(getCompareEntity("bmc"), undefined);
    assert.equal(getCompareEntity("ghmc"), undefined);
  });

  it("thin peer set is labelled when N < 3, still a number when N ≥ 1", () => {
    const one = medianOf([hit("a", 9)], META);
    assert.ok(one);
    assert.equal(one.n, 1);
    assert.equal(one.thin, true);
    assert.equal(one.money.rupees, fromCrore(9, "be", "2026-27", "mh-home-whitebook-2026-27").rupees);
    const two = medianOf([hit("a", 9), hit("b", 11)], META);
    assert.ok(two);
    assert.equal(two.thin, true);
    assert.equal(two.method, "mid-pair");
  });
});
