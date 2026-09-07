import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "mz-afs-2026-27";

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

/** AFS 2055 Police total (Police + Forensic Science Laboratory under 2055). Not jails 2056. */
export const mz2055: LineItem = {
  id: "mz-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue (lakhs, converted to crore)",
  head: "2055",
  amounts: four("71603.78", "75245.29", "75980.73", "78057.72"),
};

/** AFS 4055 Capital Outlay on Police. */
export const mz4055: LineItem = {
  id: "mz-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital",
  head: "4055",
  amounts: four("171.10", "50.10", "2888.46", "50.10"),
};

export const mzFunctional: LineItem = {
  id: "mz-functional",
  plainLabel: "Mizoram Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: mz2055.amounts.map((m, i) => {
    const cap = mz4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const MZ_HEADLINE_YEAR = "2026-27";
export const MZ_HEADLINE_SERIES: Series = "be";
