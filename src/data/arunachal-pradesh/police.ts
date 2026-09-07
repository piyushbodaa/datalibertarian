import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "ar-afs-2026-27";

/** AFS prints ₹ in thousands. Crore = (commas stripped) ÷ 10,000. */
function fromThousands(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(a: string, be25: string, re25: string, be26: string, citationId = CITE): Money[] {
  return [
    fromThousands(a, "actual", "2024-25", citationId),
    fromThousands(be25, "be", "2025-26", citationId),
    fromThousands(re25, "re", "2025-26", citationId),
    fromThousands(be26, "be", "2026-27", citationId),
  ];
}

/** AFS Statement B — 2055 Police statewide (voted). Not jails 2056. */
export const ar2055: LineItem = {
  id: "ar-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement B (thousands, converted to crore)",
  head: "2055",
  amounts: four("13592452", "29388908", "15350148", "19819718"),
};

/** AFS Statement B capital — 4055 Capital Outlay on Police statewide. */
export const ar4055: LineItem = {
  id: "ar-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement B",
  head: "4055",
  amounts: four("2320223", "1357600", "2463357", "290786"),
};

export const arFunctional: LineItem = {
  id: "ar-functional",
  plainLabel: "Arunachal Pradesh Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: ar2055.amounts.map((m, i) => {
    const cap = ar4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const AR_HEADLINE_YEAR = "2026-27";
export const AR_HEADLINE_SERIES: Series = "be";
