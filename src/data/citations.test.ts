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

  it("registers only the citations we ship", () => {
    assert.deepEqual(Object.keys(citations).sort(), [
      "mh-appropriation-2025-26",
      "mh-home-whitebook-2026-27",
      "mh-pink-book-2026-27",
      "union-sbe51-2026-27",
      "union-sumsbe-2026-27",
    ]);
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
