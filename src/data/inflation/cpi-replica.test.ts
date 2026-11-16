import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  aggregateYoung, auditReplicaCoverage, compileJevonsLink, geometricMean,
  type BasketWeightItem, type IndexSector, type JevonsInput, type PriceQuotation,
  type ReplicaItemEvidence,
} from "./cpi-replica.ts";

const near = (actual: number | null, expected: number, tolerance = 1e-9) => {
  assert.notEqual(actual, null);
  assert.ok(Math.abs(actual! - expected) <= tolerance, `${actual} versus ${expected}`);
};
const quote = (rupees: number, period: string, outletId: string): PriceQuotation => ({
  rupees, period, outletId, specificationId: "biscuit-brand-a-100g", unit: "g", quantity: 100,
  source: `fixture:receipt/${outletId}/${period}`,
});
// MoSPI Expert Group Report §4.6.6, printed pp.59–60: five matched biscuit quotes.
const workedExample = (): JevonsInput => ({
  itemId: "biscuits", state: "example-state", sector: "rural", period: "2025-02", previousPeriod: "2025-01",
  previousIndex: 100, expectedQuoteIds: ["a", "b", "c", "d", "e"],
  quotations: [96, 91, 83, 40, 150].map((price, i) => ({
    id: ["a", "b", "c", "d", "e"][i],
    previous: quote(price, "2025-01", `outlet-${i}`),
    current: quote(i === 0 ? 100 : price, "2025-02", `outlet-${i}`),
  })),
});

describe("CPI 2024 elementary chain", () => {
  it("reproduces the report's five-quotation short Jevons example", () => {
    const result = compileJevonsLink(workedExample());
    assert.equal(result.status, "complete");
    near(result.index, 100 * (100 / 96) ** (1 / 5));
    near(result.index, 100.8198, 0.00005);
    assert.equal(result.observedCount, 5);
    assert.equal(result.imputedCount, 0);
  });
  it("imputes a reviewed temporary absence using observed same-panel movement", () => {
    const input = workedExample();
    input.quotations = input.quotations.map(q => q.id === "c" ? { ...q, current: null, temporaryMissing: true } : q);
    const result = compileJevonsLink(input);
    assert.equal(result.status, "complete");
    near(result.index, 100 * (100 / 96) ** (1 / 4));
    near(result.index, 101.0258, 0.00005);
    assert.equal(result.expectedCount, 5);
    assert.equal(result.imputedCount, 1);
    assert.equal(result.relatives.find(q => q.id === "c")?.treatment, "within-item-imputation");
  });
  it("requires an explicit documented donor when the entire panel is missing", () => {
    const input = workedExample();
    input.quotations = input.quotations.map(q => ({ ...q, current: null, temporaryMissing: true }));
    assert.equal(compileJevonsLink(input).index, null);
    const donor = compileJevonsLink({ ...input, higherAggregateMovement: { factor: 1.03, source: "fixture:comparable-subclass" } });
    near(donor.index, 103);
    assert.equal(donor.imputedCount, 5);
    const administered = compileJevonsLink({ ...input, administeredUnchanged: { source: "fixture:verified-unchanged-tariff" } });
    near(administered.index, 100);
    assert.ok(administered.relatives.every(q => q.treatment === "administered-carry-forward"));
  });
  it("rejects unmatched shops, specifications and pack sizes", () => {
    for (const change of [{ outletId: "other-shop" }, { specificationId: "premium-biscuit" }, { quantity: 90 }, { unit: "kg" }]) {
      const input = workedExample();
      input.quotations = input.quotations.map((q, i) => i ? q : { ...q, current: { ...q.current!, ...change } });
      assert.equal(compileJevonsLink(input).index, null);
    }
  });
  it("does not silently replace wrong dates, zero prices or omitted panel entries with imputations", () => {
    for (const change of [{ period: "2025-02-15" }, { period: "2025-01" }, { rupees: 0 }, { rupees: NaN }]) {
      const input = workedExample();
      input.quotations = input.quotations.map((q, i) => i ? q : { ...q, current: { ...q.current!, ...change }, temporaryMissing: true });
      assert.equal(compileJevonsLink(input).index, null);
    }
    const omitted = workedExample();
    omitted.quotations = omitted.quotations.slice(1);
    assert.equal(compileJevonsLink(omitted).index, null);
  });
  it("cannot initialise a 2024-base chain from an arbitrary first quote", () => {
    assert.equal(compileJevonsLink({ ...workedExample(), previousIndex: null }).index, null);
    assert.equal(compileJevonsLink({ ...workedExample(), previousPeriod: "2024-12" }).status, "invalid");
    assert.equal(compileJevonsLink({ ...workedExample(), expectedQuoteIds: ["a", "a"] }).status, "invalid");
  });
  it("computes geometric means without overflowing a product of ordinary relatives", () => {
    near(geometricMean(Array(1000).fill(10)), 10);
    assert.equal(geometricMean([1, 0]), null);
    assert.equal(geometricMean([]), null);
  });
});

describe("CPI 2024 higher aggregation", () => {
  it("takes a ratio of weighted index levels, not a weighted mean of item inflation rates", () => {
    const result = aggregateYoung([
      { id: "a", weight: 50, currentIndex: 120, yearAgoIndex: 100 },
      { id: "b", weight: 50, currentIndex: 200, yearAgoIndex: 200 },
    ]);
    near(result.currentIndex, 160);
    near(result.yearAgoIndex, 150);
    near(result.yoyPct, (160 / 150 - 1) * 100);
    assert.notEqual(result.yoyPct, 10);
  });
  it("reports expenditure-weight coverage and never renormalises away a missing child", () => {
    const result = aggregateYoung([
      { id: "a", weight: 90, currentIndex: null, yearAgoIndex: 100 },
      { id: "b", weight: 10, currentIndex: 120, yearAgoIndex: 100 },
    ]);
    near(result.currentCoveragePct, 10);
    near(result.annualCoveragePct, 10);
    assert.equal(result.currentIndex, null);
    assert.equal(result.yoyPct, null);
    assert.deepEqual(result.missingCurrentIds, ["a"]);
  });
  it("allows an observed current level while withholding an unavailable annual comparison", () => {
    const result = aggregateYoung([
      { id: "a", weight: 10, currentIndex: 120, yearAgoIndex: null },
      { id: "zero-expenditure", weight: 0, currentIndex: null, yearAgoIndex: null },
    ]);
    near(result.currentIndex, 120);
    near(result.currentCoveragePct, 100);
    near(result.annualCoveragePct, 0);
    assert.equal(result.yoyPct, null);
    assert.deepEqual(result.missingAnnualIds, ["a"]);
  });
  it("rejects duplicate children or negative weights", () => {
    const child = { id: "a", weight: 100, currentIndex: 100, yearAgoIndex: 100 };
    assert.equal(aggregateYoung([child, child]).status, "invalid");
    assert.equal(aggregateYoung([{ ...child, weight: -1 }]).status, "invalid");
  });
});

const basket = JSON.parse(readFileSync(new URL("./cpi-basket.json", import.meta.url), "utf8")) as { items: BasketWeightItem[] };
const official = JSON.parse(readFileSync(new URL("./cpi-official.json", import.meta.url), "utf8")) as {
  metadata: { period: string; previousPeriod: string };
  rows: { code: string; level: string; sector: IndexSector; currentIndex: number; previousIndex: number; yoy: number }[];
};

describe("full 358-item evidence gate", () => {
  it("reproduces the three official headline levels from all item levels and exact workbook weights within source rounding", () => {
    assert.equal(basket.items.length, 358);
    for (const sector of ["rural", "urban", "combined"] as const) {
      const rows = new Map(official.rows.filter(r => r.sector === sector && r.level === "item").map(r => [r.code, r]));
      assert.equal(rows.size, 358);
      const result = aggregateYoung(basket.items.map(item => ({
        id: item.id, weight: item.weights[sector],
        currentIndex: rows.get(item.id)?.currentIndex ?? null,
        yearAgoIndex: rows.get(item.id)?.previousIndex ?? null,
      })));
      const headline = official.rows.find(r => r.sector === sector && r.level === "general")!;
      assert.equal(result.status, "complete");
      // Both child levels and published aggregate are rounded to two decimals.
      near(result.currentIndex, headline.currentIndex, 0.01);
      near(result.yearAgoIndex, headline.previousIndex, 0.01);
      near(result.yoyPct, headline.yoy, 0.02);
    }
  });
  it("keeps the full-basket headline unavailable when no independent panels exist", () => {
    const result = auditReplicaCoverage(basket.items, [], official.metadata.period);
    assert.equal(result.totalItemCount, 358);
    assert.equal(result.eligibleItemCount, 0);
    assert.equal(result.currentCoveragePct, 0);
    assert.equal(result.currentIndex, null);
    assert.equal(result.yoyPct, null);
    assert.equal(result.missingCurrentIds.length, 358);
  });
  const evidence = (): ReplicaItemEvidence => ({
    itemId: basket.items[0].id, sector: "combined", period: official.metadata.period,
    yearAgoPeriod: official.metadata.previousPeriod, baseYear: 2024,
    currentIndex: 110, yearAgoIndex: 100, origin: "independent-price-panel",
    stateSectorCoverageComplete: true, specialistWeightsComplete: true, chainAnchoredToBase: true,
    evidenceSources: ["fixture:complete-reviewed-price-panel"],
  });
  it("does not rebrand official indices or a national daily quote as independent measured CPI", () => {
    for (const origin of ["official-index", "spot-price"] as const) {
      const result = auditReplicaCoverage(basket.items, [{ ...evidence(), origin }], official.metadata.period);
      assert.equal(result.eligibleItemCount, 0);
      assert.equal(result.currentCoveragePct, 0);
      assert.equal(result.rejectedEvidence.length, 1);
    }
  });
  it("rejects mismatched dates, unanchored chains, incomplete geography and evidence without sources", () => {
    for (const change of [
      { period: "2026-10-15" }, { yearAgoPeriod: "2025-09" }, { baseYear: 2025 },
      { stateSectorCoverageComplete: false }, { specialistWeightsComplete: false },
      { chainAnchoredToBase: false }, { evidenceSources: [] },
    ]) {
      const result = auditReplicaCoverage(basket.items, [{ ...evidence(), ...change }], official.metadata.period);
      assert.equal(result.eligibleItemCount, 0);
      assert.equal(result.yoyPct, null);
    }
  });
  it("counts verified partial coverage by official expenditure weight while withholding the headline", () => {
    const result = auditReplicaCoverage(basket.items, [evidence()], official.metadata.period);
    assert.equal(result.eligibleItemCount, 1);
    near(result.currentCoveragePct, basket.items[0].weights.combined, 1e-10);
    assert.equal(result.currentIndex, null);
    assert.equal(result.yoyPct, null);
    const duplicated = auditReplicaCoverage(basket.items, [evidence(), evidence(), evidence()], official.metadata.period);
    assert.equal(duplicated.eligibleItemCount, 0);
    assert.equal(duplicated.rejectedEvidence.length, 2);
  });
  it("rejects a filtered basket instead of giving it a full-coverage national headline", () => {
    const oneItem = [{ ...basket.items[0], weights: { rural: 100, urban: 100, combined: 100 } }];
    const result = auditReplicaCoverage(oneItem, [evidence()], official.metadata.period);
    assert.equal(result.status, "invalid");
    assert.equal(result.eligibleItemCount, 0);
    assert.equal(result.annualCoveragePct, 0);
    assert.equal(result.yoyPct, null);
  });
  it("requires the complete official weight scale for a national publication audit", () => {
    const scaled = basket.items.map(item => ({ ...item, weights: { ...item.weights, combined: item.weights.combined / 2 } }));
    const result = auditReplicaCoverage(scaled, [evidence()], official.metadata.period);
    assert.equal(result.status, "invalid");
    assert.equal(result.eligibleItemCount, 0);
    assert.equal(result.annualCoveragePct, 0);
  });
  it("does not report eligible evidence for an invalid target reference month", () => {
    const invalidRecord = { ...evidence(), period: "2026-99", yearAgoPeriod: "2025-99" };
    const result = auditReplicaCoverage(basket.items, [invalidRecord], "2026-99");
    assert.equal(result.status, "invalid");
    assert.equal(result.eligibleItemCount, 0);
    assert.equal(result.currentCoveragePct, 0);
    assert.equal(result.yoyPct, null);
  });
});
