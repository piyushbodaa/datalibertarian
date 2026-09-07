import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "cg-afs-2026-27";
const CITE_HOME = "cg-t02-2026-27";

/** AFS prints rupees in thousands (e.g. 72,40,00,61). */
function fromThousands(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(a: string, be25: string, re25: string, be26: string): Money[] {
  return [
    fromThousands(a, "actual", "2024-25"),
    fromThousands(be25, "be", "2025-26"),
    fromThousands(re25, "re", "2025-26"),
    fromThousands(be26, "be", "2026-27"),
  ];
}

/** 2055 Police — AFS Volume I revenue. Not jails 2056. */
export const cg2055: LineItem = {
  id: "cg-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Volume I revenue (thousands, converted to crore)",
  head: "2055",
  amounts: four("56,72,15,17", "70,15,36,68", "61,86,19,32", "72,40,00,61"),
};

/** 4055 Capital Outlay on Police — AFS Volume I capital. */
export const cg4055: LineItem = {
  id: "cg-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Volume I capital",
  head: "4055",
  amounts: four("8,53,59,40", "8,81,45,46", "5,95,73,50", "6,60,61,40"),
};

export const cgFunctional: LineItem = {
  id: "cg-functional",
  plainLabel: "Chhattisgarh Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: cg2055.amounts.map((m, i) => {
    const cap = cg4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Home Department Book 02 — MIXED (fire, home guards, other admin). Quieter. */
export const cgDemand02: LineItem = {
  id: "cg-d02-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Home Department Book 02 — revenue + capital (thousands)",
  head: "demand-02-home",
  amounts: [fromThousands("83823011", "be", "2026-27", CITE_HOME)],
};

export const CG_HEADLINE_YEAR = "2026-27";
export const CG_HEADLINE_SERIES: Series = "be";
