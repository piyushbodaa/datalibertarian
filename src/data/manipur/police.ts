import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "mn-afs-2026-27";
const CITE_DEMAND = "mn-dfg-2026-27";

/** AFS prints ₹ in lakhs. Crore = (commas stripped) ÷ 100. */
function fromLakhs(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const lakhs = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(lakhs)) throw new Error(`Bad lakhs: ${printed}`);
  const rupees = Math.round(lakhs * 100_000);
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(a: string, be25: string, re25: string, be26: string, citationId = CITE): Money[] {
  return [
    fromLakhs(a, "actual", "2024-25", citationId),
    fromLakhs(be25, "be", "2025-26", citationId),
    fromLakhs(re25, "re", "2025-26", citationId),
    fromLakhs(be26, "be", "2026-27", citationId),
  ];
}

/** AFS revenue disbursement — 2055 Police (net of SRE recovery as printed). Not jails 2056. */
export const mn2055: LineItem = {
  id: "mn-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue (lakhs, converted to crore)",
  head: "2055",
  amounts: four("281420.47", "301728.77", "304506.86", "268064.24"),
};

/** AFS capital — 4055 Capital Outlay on Police. */
export const mn4055: LineItem = {
  id: "mn-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital",
  head: "4055",
  amounts: four("16083.44", "19205.81", "18297.53", "5809.81"),
};

export const mnFunctional: LineItem = {
  id: "mn-functional",
  plainLabel: "Manipur Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: mn2055.amounts.map((m, i) => {
    const cap = mn4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand 07 Police — MIXED (2216 housing, 2235, 3454 census, plus 2055/4055). Quieter. */
export const mnDemand07: LineItem = {
  id: "mn-d07-police",
  plainLabel: "Police demand (not only 2055)",
  officialName: "Demand 07 Police — net total (voted)",
  head: "demand-07-police",
  amounts: [fromLakhs("274197.49", "be", "2026-27", CITE_DEMAND)],
};

export const MN_HEADLINE_YEAR = "2026-27";
export const MN_HEADLINE_SERIES: Series = "be";
