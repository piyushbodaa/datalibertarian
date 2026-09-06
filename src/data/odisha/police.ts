import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "od-d01-2026-27";

/** Demand 01 prints rupees in thousands (e.g. 7100,94,20). */
function fromThousands(printed: string, series: Series, fiscalYear: string): Money {
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

/** 2055 Police — Demand 01 Home abstract total (voted + charged). Not jails 2056. */
export const od2055: LineItem = {
  id: "od-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — Demand 01 Home (thousands, converted to crore)",
  head: "2055",
  amounts: four("5238,57,54", "6831,05,32", "6840,30,42", "7100,94,20"),
};

/** No 4055 major head in this Demand. Hero is 2055 only — buildings not isolated. */
export const odFunctional: LineItem = {
  id: "od-functional",
  plainLabel: "Odisha Police spending",
  officialName: "2055 Police (Demand 01) — 4055 not printed as a police major head",
  head: "total",
  amounts: od2055.amounts.map((m) => ({ ...m })),
};

/** Whole Demand 01 Home — MIXED (justice, jails, secretariat, 4059/4216). Quieter. */
export const odDemand01: LineItem = {
  id: "od-d01-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand 01 Home — consolidated fund total",
  head: "demand-01-home",
  amounts: [fromThousands("11028,55,89", "be", "2026-27")],
};

export const OD_HEADLINE_YEAR = "2026-27";
export const OD_HEADLINE_SERIES: Series = "be";
