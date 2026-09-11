import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCitation } from "./sources.ts";
import {
  AS_OF,
  BOARD_IDS,
  CPI_FOOD,
  CPI_HEADLINE,
  getInflationItem,
  INFLATION_ITEMS,
} from "./inflation/items.ts";
import { pctChange, yoyOf } from "./inflation/yoy.ts";

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
    for (const id of ["pmd-retail-2026-09-10", "ppac-fuel-2026-09-10", "mospi-cpi-2026-07"]) {
      assert.ok(getCitation(id), id);
    }
  });
});
