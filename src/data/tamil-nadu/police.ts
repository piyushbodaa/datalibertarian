import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "tn-demand22-2026-27";

/** Demand 22 prints rupees in thousands (e.g. 12,435,99,57). */
function fromThousands(
  printed: string,
  series: Series,
  fiscalYear: string,
): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId: CITE };
}

function four(a: string, be25: string, re25: string, be26: string): Money[] {
  return [
    fromThousands(a, "actual", "2024-25"),
    fromThousands(be25, "be", "2025-26"),
    fromThousands(re25, "re", "2025-26"),
    fromThousands(be26, "be", "2026-27"),
  ];
}

/** 2055 Police — Demand 22 summary. Not the mixed Demand 22 total. */
export const tn2055: LineItem = {
  id: "tn-2055",
  plainLabel: "Police (running costs)",
  officialName: "2055 Police — Demand 22 (thousands, converted to crore)",
  head: "2055",
  amounts: four("10,763,07,20", "12,305,50,74", "11,490,23,20", "12,435,99,57"),
};

export const tn4055: LineItem = {
  id: "tn-4055",
  plainLabel: "Police buildings and equipment (capital)",
  officialName: "4055 Capital Outlay on Police — Demand 22",
  head: "4055",
  amounts: four("137,72,02", "408,18,53", "408,18,63", "353,54,08"),
};

export const tnFunctional: LineItem = {
  id: "tn-functional",
  plainLabel: "Tamil Nadu Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (Demand 22 slices)",
  head: "total",
  amounts: tn2055.amounts.map((m, i) => {
    const cap = tn4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Whole Demand 22 voted — MIXED, not police-only. Quieter block. */
export const tnDemand22Voted: LineItem = {
  id: "tn-d22-voted",
  plainLabel: "Demand 22 voted (not police-only)",
  officialName: "Demand No. 22 Police (Home, Prohibition and Excise) — voted total",
  head: "demand-22",
  amounts: [fromThousands("13,576,72,23", "be", "2026-27")],
};

export const TN_HEADLINE_YEAR = "2026-27";
export const TN_HEADLINE_SERIES: Series = "be";
