import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBasket, type PrivatePriceRow } from "./private-index.ts";

const rows: PrivatePriceRow[] = [
  {
    id: "rice",
    name: "Rice",
    category: "grain",
    unit: "kg",
    yearAgo: 20,
    monthAgo: 30,
    current: 40,
  },
  {
    id: "milk",
    name: "Milk",
    category: "dairy",
    unit: "litre",
    yearAgo: 100,
    monthAgo: 80,
    current: 100,
  },
];
const near = (actual: number | null, expected: number) => {
  assert.notEqual(actual, null);
  assert.ok(
    Math.abs(actual! - expected) < 1e-9,
    `${actual} versus ${expected}`,
  );
};

describe("private essentials index", () => {
  it("uses equal base expenditure, without averaging unlike rupee prices", () => {
    const result = calculateBasket(rows);
    assert.equal(result.status, "ok");
    near(result.index, 150);
    near(result.yoyPct, 50);
    near(result.baseCost, 200);
    near(result.currentCost, 300);
    assert.deepEqual(
      result.contributions.map((row) => row.quantity),
      [5, 1],
    );
  });
  it("costs the same annual-base quantities for month-on-month", () => {
    const result = calculateBasket(rows);
    near(result.monthCost, 230);
    near(result.momPct, (300 / 230 - 1) * 100);
    assert.notEqual(result.momPct, ((40 / 30 + 100 / 80) / 2 - 1) * 100);
  });
  it("adds item contributions to headline change", () => {
    const result = calculateBasket(rows, { rice: 300, milk: 100 });
    near(result.yoyPct, 75);
    near(
      result.contributions.reduce((sum, row) => sum + row.contributionPp!, 0),
      result.yoyPct!,
    );
    near(
      result.contributions.reduce((sum, row) => sum + row.weightPct, 0),
      100,
    );
  });
  it("preserves rates when all base spending is scaled", () => {
    const small = calculateBasket(rows, { rice: 30, milk: 70 });
    const large = calculateBasket(rows, { rice: 3000, milk: 7000 });
    near(small.yoyPct, large.yoyPct!);
    near(small.momPct, large.momPct!);
    near(large.currentCost, small.currentCost! * 100);
  });
  it("withholds an aggregate when selected annual prices are missing", () => {
    const result = calculateBasket([{ ...rows[0], current: null }, rows[1]], {
      rice: 300,
      milk: 100,
    });
    assert.equal(result.status, "incomplete");
    assert.equal(result.index, null);
    assert.equal(result.yoyPct, null);
    assert.equal(result.currentCost, null);
    assert.deepEqual(result.missingIds, ["rice"]);
    assert.equal(result.coverage.weightPct, 25);
  });
  it("does not use zero, negative or non-finite prices as observations", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      const result = calculateBasket([{ ...rows[0], yearAgo: bad }, rows[1]]);
      assert.equal(result.status, "incomplete");
      assert.equal(result.yoyPct, null);
    }
  });
  it("keeps annual result but withholds month change if monthly price is missing", () => {
    const result = calculateBasket([{ ...rows[0], monthAgo: null }, rows[1]]);
    assert.equal(result.status, "ok");
    near(result.yoyPct, 50);
    assert.equal(result.momPct, null);
    assert.equal(result.monthCost, null);
    assert.deepEqual(result.missingMonthIds, ["rice"]);
  });
  it("excludes zero-weight rows even if their prices are missing", () => {
    const result = calculateBasket([{ ...rows[0], current: null }, rows[1]], {
      rice: 0,
      milk: 100,
    });
    assert.equal(result.status, "ok");
    near(result.yoyPct, 0);
    assert.deepEqual(result.excludedIds, ["rice"]);
    assert.equal(result.coverage.selectedCount, 1);
  });
  it("does not report zero inflation for an empty basket", () => {
    for (const result of [
      calculateBasket([]),
      calculateBasket(rows, { rice: 0, milk: 0 }),
    ]) {
      assert.equal(result.status, "empty");
      assert.equal(result.yoyPct, null);
      assert.equal(result.index, null);
    }
  });
  it("rejects invalid, omitted and unknown weights", () => {
    for (const spending of [
      { rice: -1, milk: 100 },
      { rice: NaN, milk: 100 },
      { rice: Infinity, milk: 100 },
      { rice: 100 },
      { rice: 100, milk: 100, typo: 50 },
    ]) {
      const result = calculateBasket(rows, spending);
      assert.equal(result.status, "invalid");
      assert.equal(result.yoyPct, null);
      assert.ok(result.errors.length);
    }
  });
  it("rejects duplicate IDs and arithmetic overflow", () => {
    assert.equal(calculateBasket([rows[0], rows[0]]).status, "invalid");
    assert.equal(
      calculateBasket(rows, { rice: Number.MAX_VALUE, milk: Number.MAX_VALUE })
        .status,
      "invalid",
    );
    assert.equal(
      calculateBasket([{ ...rows[0], yearAgo: Number.MIN_VALUE }]).status,
      "invalid",
    );
  });
  it("handles deflation and unchanged prices without clipping", () => {
    const result = calculateBasket([{ ...rows[0], current: 10 }, rows[1]]);
    near(result.yoyPct, -25);
    near(result.index, 75);
    near(result.contributions[0].contributionPp, -25);
  });
});
