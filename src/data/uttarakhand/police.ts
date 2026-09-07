import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "uk-afs-2026-27";
const CITE_GRANT = "uk-vol5-g10-2026-27";

/** AFS / Volume 5 print rupees in thousands (e.g. 30921777). */
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

/** AFS Revenue Account A-General Services — 2055 Police. Not jails 2056. */
export const uk2055: LineItem = {
  id: "uk-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Revenue Account (thousands, converted to crore)",
  head: "2055",
  amounts: four("24448825", "27814882", "27928712", "30921777"),
};

/** AFS Capital Account — 4055 Capital Outlay on Police. Not 4059 Public Works. */
export const uk4055: LineItem = {
  id: "uk-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Capital Account",
  head: "4055",
  amounts: four("1099000", "750001", "1510001", "2555076"),
};

export const ukFunctional: LineItem = {
  id: "uk-functional",
  plainLabel: "Uttarakhand Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: uk2055.amounts.map((m, i) => {
    const cap = uk4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Grant 10 Police and Jail — MIXED (2056 jails + 4059 public works). Quieter. */
export const ukGrant10: LineItem = {
  id: "uk-g10-police-jail",
  plainLabel: "Police and Jail grant (not only police)",
  officialName: "Grant 10 Police and Jail — revenue + capital (voted)",
  head: "grant-10-police-jail",
  amounts: [fromThousands("35246958", "be", "2026-27", CITE_GRANT)],
};

export const UK_HEADLINE_YEAR = "2026-27";
export const UK_HEADLINE_SERIES: Series = "be";
