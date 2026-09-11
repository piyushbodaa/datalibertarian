import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCitation } from "./sources.ts";
import {
  AS_OF,
  BOARD_IDS,
  CPI_FOOD,
  CPI_HEADLINE,
  CPI_JUNE_INDEX,
  getInflationItem,
  INFLATION_ITEMS,
  itemsInRoom,
  printedBeside,
} from "./inflation/items.ts";
import { formatFromTo, indexChangePct, pctChange, yearPair, yoyOf } from "./inflation/yoy.ts";
import { CPI_DIVISIONS } from "./inflation/weights.ts";

describe("inflation docket", () => {
  it("every observed rupee has a living https citation", () => {
    for (const item of INFLATION_ITEMS) {
      assert.ok(item.observed.length >= 1, item.id);
      for (const p of item.observed) {
        assert.ok(p.rupees > 0, `${item.id} ${p.asOf}`);
        const c = getCitation(p.citationId);
        assert.ok(c.url.startsWith("https://"));
        assert.ok(!p.citationId.startsWith("mospi-"));
        assert.ok(!p.citationId.startsWith("prs-"));
      }
    }
  });

  it("hero board contains no MoSPI citations", () => {
    for (const id of BOARD_IDS) {
      const item = getInflationItem(id);
      assert.ok(item, id);
      for (const p of item.observed) {
        assert.ok(!p.citationId.startsWith("mospi-"), id);
      }
    }
  });

  it("eggs are a cited dozen, YoY from two PMD rupees, no CPI item rate", () => {
    const eggs = getInflationItem("eggs")!;
    const now = eggs.observed.find((p) => p.asOf === AS_OF)!;
    const then = eggs.observed.find((p) => p.asOf === "2025-09-10")!;
    assert.equal(now.rupees, 83.5);
    assert.equal(now.unit, "dozen");
    assert.equal(then.rupees, 77.14);
    const yoy = yoyOf(eggs);
    assert.ok(yoy !== undefined);
    assert.equal(eggs.official, undefined);
  });

  it("onion observed YoY is from two PMD rupees, not the CPI item rate", () => {
    const onion = getInflationItem("onion")!;
    const now = onion.observed.find((p) => p.asOf === "2026-09-10")!;
    const then = onion.observed.find((p) => p.asOf === "2025-09-10")!;
    assert.equal(now.rupees, 53.1);
    assert.equal(then.rupees, 27.88);
    const yoy = pctChange(now, then)!;
    assert.ok(Math.abs(yoy - ((53.1 / 27.88 - 1) * 100)) < 1e-9);
    assert.ok(onion.official);
    assert.equal(onion.official.yoyPct, 22.54);
    assert.notEqual(Math.round(yoy), Math.round(onion.official.yoyPct));
    assert.ok(onion.official.citationId.startsWith("mospi-"));
  });

  it("does not treat a printed zero as a year-ago price", () => {
    const now = INFLATION_ITEMS[0].observed[0];
    const zero = { ...now, rupees: 0, asOf: "2025-09-10" };
    assert.equal(pctChange(now, zero), undefined);
  });

  it("MoSPI headline is INDEX and not 0", () => {
    assert.equal(CPI_HEADLINE.yoyPct, 4.45);
    assert.equal(CPI_HEADLINE.index, 107.94);
    assert.equal(CPI_FOOD.yoyPct, 5.52);
    assert.ok(getCitation(CPI_HEADLINE.citationId).url.startsWith("https://"));
  });

  it("keeps required inflation citations", () => {
    for (const id of [
      "pmd-retail-2026-09-10",
      "ppac-fuel-2026-09-10",
      "mospi-cpi-2026-07",
      "mospi-cpi-2024-weights",
    ]) {
      assert.ok(getCitation(id), id);
    }
  });

  it("CPI 2024 Combined weights sum to 100", () => {
    const sum = CPI_DIVISIONS.reduce((s, d) => s + d.weight, 0);
    assert.ok(Math.abs(sum - 100) < 0.02, String(sum));
    const food = CPI_DIVISIONS.find((d) => d.id === "food")!;
    assert.equal(food.weight, 36.75);
    assert.equal(food.yoyPct, 5.24);
  });

  it("rice change names both rupees and both dates", () => {
    const rice = getInflationItem("rice")!;
    const pair = yearPair(rice)!;
    const line = formatFromTo(pair.then, pair.now);
    assert.match(line, /43\.03/);
    assert.match(line, /46\.34/);
    assert.match(line, /10 Sep 2025/);
    assert.match(line, /10 Sep 2026/);
    assert.ok(!itemBarePercent(line));
  });

  it("health room has no observed rupee", () => {
    assert.equal(itemsInRoom("health").length, 0);
    assert.ok(CPI_DIVISIONS.find((d) => d.id === "health")?.yoyPct === 1.34);
  });

  it("each division has a unique colour and food links to /inflation/food", () => {
    const colors = CPI_DIVISIONS.map((d) => d.color);
    assert.equal(new Set(colors).size, 12);
    assert.equal(colors.length, 12);
    const food = CPI_DIVISIONS.find((d) => d.id === "food")!;
    assert.equal(food.href, "/inflation/food");
    assert.equal(food.color, "#e07050");
    assert.ok(!colors.includes("#3c3934"));
  });

  it("Combined month-on-month is July index over June index, not an invented rate", () => {
    const mom = indexChangePct(CPI_HEADLINE.index!, CPI_JUNE_INDEX)!;
    assert.ok(Math.abs(mom - ((107.94 / 107 - 1) * 100)) < 1e-9);
  });

  it("rice left column is food division 5.24, right is the two PMD rupees", () => {
    const rice = getInflationItem("rice")!;
    const gov = printedBeside(rice);
    assert.equal(gov.kind, "division");
    assert.equal(gov.yoyPct, 5.24);
    assert.match(gov.label, /Food and beverages/);
    assert.match(gov.label, /not a rupee for this item/);
    const pair = yearPair(rice)!;
    assert.equal(pair.then.rupees, 43.03);
    assert.equal(pair.then.asOf, "2025-09-10");
    assert.equal(pair.now.rupees, 46.34);
    assert.equal(pair.now.asOf, "2026-09-10");
  });

  it("onion left column is the CPI item rate, not the food division", () => {
    const onion = getInflationItem("onion")!;
    const gov = printedBeside(onion);
    assert.equal(gov.kind, "item");
    assert.equal(gov.yoyPct, 22.54);
    const pair = yearPair(onion)!;
    const yoy = pctChange(pair.now, pair.then)!;
    assert.ok(Math.abs(yoy - ((53.1 / 27.88 - 1) * 100)) < 1e-9);
    assert.notEqual(Math.round(yoy), Math.round(gov.yoyPct));
  });

  it("eggs left column is food division, not a fake egg rupee", () => {
    const eggs = getInflationItem("eggs")!;
    const gov = printedBeside(eggs);
    assert.equal(gov.kind, "division");
    assert.equal(gov.yoyPct, 5.24);
    assert.equal(eggs.official, undefined);
    const pair = yearPair(eggs)!;
    assert.equal(pair.then.rupees, 77.14);
    assert.equal(pair.now.rupees, 83.5);
    assert.equal(pair.now.unit, "dozen");
  });

  it("petrol left column is transport division, not a Delhi pump rupee", () => {
    const petrol = getInflationItem("petrol-delhi")!;
    const gov = printedBeside(petrol);
    assert.equal(gov.kind, "division");
    assert.equal(gov.yoyPct, 4.43);
    assert.match(gov.label, /Transport/);
  });

  it("every observed item has a cited printed-beside rate", () => {
    for (const item of INFLATION_ITEMS) {
      const gov = printedBeside(item);
      assert.ok(typeof gov.yoyPct === "number", item.id);
      assert.ok(getCitation(gov.citationId).url.startsWith("https://"), item.id);
      assert.ok(gov.citationId.startsWith("mospi-"), item.id);
    }
  });
});

function itemBarePercent(line: string): boolean {
  return /^\s*[+\-−]?\d/.test(line) && !line.includes("→");
}
