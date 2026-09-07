import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE_AFS = "pb-afs-2026-27";
const CITE_CAP = "pb-capital-2026-27";

/** AFS and Capital book print rupees in thousands (e.g. 8452,64,68). Crore = thousands ÷ 10,000. */
function fromThousands(
  printed: string,
  series: Series,
  fiscalYear: string,
  citationId: string,
): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(
  a: string,
  be25: string,
  re25: string,
  be26: string,
  citationId: string,
): Money[] {
  return [
    fromThousands(a, "actual", "2024-25", citationId),
    fromThousands(be25, "be", "2025-26", citationId),
    fromThousands(re25, "re", "2025-26", citationId),
    fromThousands(be26, "be", "2026-27", citationId),
  ];
}

/** AFS revenue disbursements — 2055 Police statewide. Not jails 2056. */
export const pb2055: LineItem = {
  id: "pb-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue disbursements (thousands, converted to crore)",
  head: "2055",
  amounts: four("8158,31,40", "8521,21,32", "8136,34,55", "8452,64,68", CITE_AFS),
};

/**
 * Capital Demand 12 Home Affairs — 4055 under DGP.
 * Demand 36 Jails also prints a 4055 line (central/district jails, prison modernisation) — not taken.
 */
export const pb4055: LineItem = {
  id: "pb-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — Demand 12 Home Affairs, DGP (thousands)",
  head: "4055",
  amounts: four("219,32,74", "556,78,23", "292,16,29", "467,66,68", CITE_CAP),
};

export const pbFunctional: LineItem = {
  id: "pb-functional",
  plainLabel: "Punjab Police spending",
  officialName: "2055 Police (AFS) + 4055 Capital Outlay on Police (Demand 12 DGP)",
  head: "total",
  amounts: pb2055.amounts.map((m, i) => {
    const cap = pb4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE_AFS,
    };
  }),
};

export const PB_HEADLINE_YEAR = "2026-27";
export const PB_HEADLINE_SERIES: Series = "be";
