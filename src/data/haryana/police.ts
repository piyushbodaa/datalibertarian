import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "hr-afs-2026-27";

/** AFS prints rupees in thousands (e.g. 74845100). Crore = thousands ÷ 10,000. */
function fromThousands(thousands: number, series: Series, fiscalYear: string): Money {
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${thousands}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId: CITE };
}

function four(a: number, be25: number, re25: number, be26: number): Money[] {
  return [
    fromThousands(a, "actual", "2024-25"),
    fromThousands(be25, "be", "2025-26"),
    fromThousands(re25, "re", "2025-26"),
    fromThousands(be26, "be", "2026-27"),
  ];
}

/** AFS General Abstract of Disbursements — 2055 Police. Not jails 2056. */
export const hr2055: LineItem = {
  id: "hr-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue disbursements (thousands, converted to crore)",
  head: "2055",
  amounts: four(63_834_872, 73_876_825, 70_661_735, 74_845_100),
};

/** AFS capital account of general services — 4055 Capital Outlay on Police. Not 4059 public works. */
export const hr4055: LineItem = {
  id: "hr-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital disbursements",
  head: "4055",
  amounts: four(1_047_644, 2_000_100, 1_820_500, 2_200_100),
};

export const hrFunctional: LineItem = {
  id: "hr-functional",
  plainLabel: "Haryana Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: hr2055.amounts.map((m, i) => {
    const cap = hr4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const HR_HEADLINE_YEAR = "2026-27";
export const HR_HEADLINE_SERIES: Series = "be";
