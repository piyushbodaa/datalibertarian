import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "nl-afs-2026-27";

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

/** AFS Statement I revenue — 2055 Police statewide. Not jails 2056. */
export const nl2055: LineItem = {
  id: "nl-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement I (lakhs, converted to crore)",
  head: "2055",
  amounts: four("197842.73", "196930.70", "193769.29", "211889.82"),
};

/** AFS Statement I capital — 4055 Capital Outlay on Police. */
export const nl4055: LineItem = {
  id: "nl-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement I",
  head: "4055",
  amounts: four("13606.69", "1739.69", "7838.35", "1914.01"),
};

export const nlFunctional: LineItem = {
  id: "nl-functional",
  plainLabel: "Nagaland Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: nl2055.amounts.map((m, i) => {
    const cap = nl4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const NL_HEADLINE_YEAR = "2026-27";
export const NL_HEADLINE_SERIES: Series = "be";
