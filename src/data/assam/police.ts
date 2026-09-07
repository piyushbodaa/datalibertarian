import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "as-afs-2026-27";

/** AFS prints ₹ in lakhs (e.g. 672353.55). Crore = lakhs ÷ 100. */
function fromLakhs(lakhs: number, series: Series, fiscalYear: string): Money {
  const rupees = Math.round(lakhs * 100_000);
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId: CITE };
}

function four(a: number, be25: number, re25: number, be26: number): Money[] {
  return [
    fromLakhs(a, "actual", "2024-25"),
    fromLakhs(be25, "be", "2025-26"),
    fromLakhs(re25, "re", "2025-26"),
    fromLakhs(be26, "be", "2026-27"),
  ];
}

/**
 * 2055 Police — AFS Statement B statewide.
 * Printed as Grant 14 (voted+charged) + Grant 19. Desk-sum of those two lines. Not jails 2056.
 */
export const as2055: LineItem = {
  id: "as-2055",
  plainLabel: "Running costs",
  officialName:
    "2055 Police — AFS Statement B statewide (Grant 14 + Grant 19 printed lines, lakhs, converted to crore)",
  head: "2055",
  amounts: four(542333.86, 657884.51, 664273.52, 678510.95),
};

/** 4055 Capital Outlay on Police — AFS Statement B Grant 14. Grant 19 4055 is not printed with a figure. */
export const as4055: LineItem = {
  id: "as-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement B, Grant 14",
  head: "4055",
  amounts: four(52736.75, 59117.59, 59317.59, 35461.17),
};

export const asFunctional: LineItem = {
  id: "as-functional",
  plainLabel: "Assam Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: as2055.amounts.map((m, i) => {
    const cap = as4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const AS_HEADLINE_YEAR = "2026-27";
export const AS_HEADLINE_SERIES: Series = "be";
