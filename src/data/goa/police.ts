import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "ga-afs-2026-27";
const CITE_DEMAND = "ga-vol1-2026-27";

/** AFS prints ₹ in lakhs (e.g. 100878.45). Crore = lakhs ÷ 100. */
function fromLakhs(lakhs: number, series: Series, fiscalYear: string, citationId = CITE): Money {
  const rupees = Math.round(lakhs * 100_000);
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(a: number, be25: number, re25: number, be26: number): Money[] {
  return [
    fromLakhs(a, "actual", "2024-25"),
    fromLakhs(be25, "be", "2025-26"),
    fromLakhs(re25, "re", "2025-26"),
    fromLakhs(be26, "be", "2026-27"),
  ];
}

/** 2055 Police — AFS revenue disbursement statewide (includes forensic Demand 91). Not jails 2056. */
export const ga2055: LineItem = {
  id: "ga-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue account disbursement (lakhs, converted to crore)",
  head: "2055",
  amounts: four(78465.82, 99985.96, 101445.05, 100878.45),
};

/** 4055 Capital Outlay on Police — AFS capital disbursement. */
export const ga4055: LineItem = {
  id: "ga-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital account disbursement",
  head: "4055",
  amounts: four(258.2, 4250.04, 5250.04, 5595.05),
};

export const gaFunctional: LineItem = {
  id: "ga-functional",
  plainLabel: "Goa Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: ga2055.amounts.map((m, i) => {
    const cap = ga4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand 17 Police — MIXED (2071 pensions, 3055 road transport). Quieter. Not the statewide 2055. */
export const gaDemand17: LineItem = {
  id: "ga-d17-police",
  plainLabel: "Police demand (not only the police line)",
  officialName: "Demand No. 17 Police — total (2055 + 2071 + 3055 + 4055)",
  head: "demand-17-police",
  amounts: [fromLakhs(110000.01, "be", "2026-27", CITE_DEMAND)],
};

export const GA_HEADLINE_YEAR = "2026-27";
export const GA_HEADLINE_SERIES: Series = "be";
