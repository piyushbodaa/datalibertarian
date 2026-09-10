import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "rj-vol2b-2026-27";
const CITE_CAP = "rj-vol3a-2026-27";
const CITE_DEMAND = "rj-vol1-2026-27";

/** Vol2b / Vol3a print ₹ in thousands (रुपये सहस्र में). Crore = thousands ÷ 10,000. */
function fromThousands(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(
  a: string,
  be25: string,
  re25: string,
  be26: string,
  citationId = CITE,
): Money[] {
  return [
    fromThousands(a, "actual", "2024-25", citationId),
    fromThousands(be25, "be", "2025-26", citationId),
    fromThousands(re25, "re", "2025-26", citationId),
    fromThousands(be26, "be", "2026-27", citationId),
  ];
}

/**
 * Vol2b 2055 सारांश printed p.168 — वृहद योग (voted + charged).
 * Four columns are State fund + Central assistance (the योग for BE 2026-27).
 * Not jails 2056. Not Budget at a Glance Police Department ₹556.16 cr.
 */
export const rj2055: LineItem = {
  id: "rj-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — Vol2b वृहद योग State+Central (thousands, converted to crore)",
  head: "2055",
  amounts: four("90,72,80,45", "1,07,41,63,84", "1,03,83,69,15", "1,13,79,64,74"),
};

/**
 * Vol3a 4055 सारांश printed p.4 — वृहद योग (net after 902 disaster-fund recoveries).
 * Four columns are State fund + Central assistance.
 */
export const rj4055: LineItem = {
  id: "rj-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — Vol3a वृहद योग State+Central",
  head: "4055",
  amounts: four("94,76,28", "3,83,65,34", "3,13,54,13", "3,49,00,14", CITE_CAP),
};

export const rjFunctional: LineItem = {
  id: "rj-functional",
  plainLabel: "Rajasthan Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (Vol2b + Vol3a statewide)",
  head: "total",
  amounts: rj2055.amounts.map((m, i) => {
    const cap = rj4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Vol1 Schedule of Demands — Demand 18 Home (Police) net voted + charged. MIXED. Quieter. */
export const rjDemand18: LineItem = {
  id: "rj-d18-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand 18 — Vol1 schedule net voted + charged (mixed)",
  head: "demand-18-home",
  amounts: [fromThousands("1,23,94,71,28", "be", "2026-27", CITE_DEMAND)],
};

export const RJ_HEADLINE_YEAR = "2026-27";
export const RJ_HEADLINE_SERIES: Series = "be";
