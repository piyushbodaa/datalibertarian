import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "ap-afs-2026-27";
const CITE_DEMAND = "ap-vol3-3-2026-27";

/** AFS prints ₹ in lakhs as 8272,23.46 → 8,272.2346 crore. Crore = (commas stripped) ÷ 100. */
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

/** AFS Statement D — 2055 Police statewide. Not jails 2056. Not one HoD. */
export const ap2055: LineItem = {
  id: "ap-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement D (lakhs, converted to crore)",
  head: "2055",
  amounts: four("7511,58.68", "7699,57.71", "7717,51.77", "8272,23.46"),
};

/** AFS Statement E — 4055 Capital Outlay on Police statewide. */
export const ap4055: LineItem = {
  id: "ap-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement E",
  head: "4055",
  amounts: four("183,20.71", "195,63.99", "235,29.75", "294,85.91"),
};

export const apFunctional: LineItem = {
  id: "ap-functional",
  plainLabel: "Andhra Pradesh Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: ap2055.amounts.map((m, i) => {
    const cap = ap4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand X Home — MIXED (jails, fire, printing, home guards, prosecutions). Quieter. */
export const apDemandX: LineItem = {
  id: "ap-d10-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand X Home Administration — net total (voted)",
  head: "demand-10-home",
  amounts: [fromLakhs("9164,94.68", "be", "2026-27", CITE_DEMAND)],
};

export const AP_HEADLINE_YEAR = "2026-27";
export const AP_HEADLINE_SERIES: Series = "be";
