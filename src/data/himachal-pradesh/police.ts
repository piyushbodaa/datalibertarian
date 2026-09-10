import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "hp-afs-2026-27";
const CITE_DEMAND = "hp-d07-2026-27";

/** AFS prints ₹ in lakhs (Rs. In Lacs). Crore = (commas stripped) ÷ 100. */
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

/** AFS Consolidated Fund Revenue Account Expenditure — 2055 Police statewide. Not jails 2056. Not Demand 07 mixed. */
export const hp2055: LineItem = {
  id: "hp-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue expenditure (lakhs, converted to crore)",
  head: "2055",
  amounts: four("155346.25", "163550.87", "153618.72", "162088.85"),
};

/** AFS Consolidated Fund Capital Account Expenditure — 4055 Capital Outlay on Police statewide. */
export const hp4055: LineItem = {
  id: "hp-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital expenditure",
  head: "4055",
  amounts: four("4944.36", "714.20", "2349.44", "514.00"),
};

export const hpFunctional: LineItem = {
  id: "hp-functional",
  plainLabel: "Himachal Pradesh Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: hp2055.amounts.map((m, i) => {
    const cap = hp4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand 07 Police and Allied Organisations — MIXED (jails, home guards, housing). Quieter. */
export const hpDemand07: LineItem = {
  id: "hp-d07-allied",
  plainLabel: "Police and Allied grant (not only police)",
  officialName: "Demand 07 Police and Allied Organisations — revenue + capital",
  head: "demand-07-allied",
  amounts: [fromLakhs("175176.69", "be", "2026-27", CITE_DEMAND)],
};

export const HP_HEADLINE_YEAR = "2026-27";
export const HP_HEADLINE_SERIES: Series = "be";
