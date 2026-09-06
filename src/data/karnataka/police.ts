import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "ka-expvol1-2026-27";

/** Karnataka prints ₹ in lakhs. 1 lakh = ₹1,00,000. Crore = lakhs / 100. */
function fromLakhs(lakhs: number, series: Series, fiscalYear: string): Money {
  const rupees = Math.round(lakhs * 100_000);
  return {
    crore: rupees / 10_000_000,
    rupees,
    series,
    fiscalYear,
    citationId: CITE,
  };
}

function four(actual: number, be25: number, re25: number, be26: number): Money[] {
  return [
    fromLakhs(actual, "actual", "2024-25"),
    fromLakhs(be25, "be", "2025-26"),
    fromLakhs(re25, "re", "2025-26"),
    fromLakhs(be26, "be", "2026-27"),
  ];
}

/** Demand 05 Home — 2055 Police HOA total. Not jails 2056, not Home Guards 2070. */
export const ka2055: LineItem = {
  id: "ka-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — Demand 05 Home (lakhs, converted to crore)",
  head: "2055",
  amounts: four(911606.08, 1101107.12, 1086767.99, 1209441.94),
};

export const ka4055: LineItem = {
  id: "ka-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — Demand 05 Home",
  head: "4055",
  amounts: four(31623.61, 45018.0, 47117.57, 45300.0),
};

export const kaFunctional: LineItem = {
  id: "ka-functional",
  plainLabel: "Karnataka Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (Demand 05 Home slices)",
  head: "total",
  amounts: ka2055.amounts.map((m, i) => {
    const cap = ka4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** 2055-00-109-1-01 Police Establishment in Existing Districts — printed HOA total. */
export const ka109: LineItem = {
  id: "ka-2055-109",
  plainLabel: "District police establishment",
  officialName: "2055-00-109-1-01 Police Establishment in Existing Districts",
  head: "2055",
  parentId: "ka-2055",
  amounts: four(708854.52, 821933.01, 827068.01, 895702.48),
};

/** Demand 05 Home department total — MIXED (jails, home guards, fire, 2014, 4059). Quieter. */
export const kaDemand05Home: LineItem = {
  id: "ka-d05-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand 05 Home — department total, Volume-1 abstract",
  head: "demand-05-home",
  amounts: [fromLakhs(1395672.85, "be", "2026-27")],
};

export const KA_HEADLINE_YEAR = "2026-27";
export const KA_HEADLINE_SERIES: Series = "be";
