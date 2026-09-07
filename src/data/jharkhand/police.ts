import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "jh-afs-2026-27";

/** AFS prints ₹ in lakhs (e.g. 772604.67). Crore = lakhs ÷ 100. */
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

/** 2055 Police — AFS Statement II revenue, Total column. Not jails 2056. */
export const jh2055: LineItem = {
  id: "jh-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement II revenue Total (lakhs, converted to crore)",
  head: "2055",
  amounts: four(693471.27, 686229.02, 716034.09, 772604.67),
};

/** 4055 Capital Outlay on Police — AFS Statement II capital, Total column. */
export const jh4055: LineItem = {
  id: "jh-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement II capital Total",
  head: "4055",
  amounts: four(35731.58, 53345.82, 44123.04, 56500.0),
};

export const jhFunctional: LineItem = {
  id: "jh-functional",
  plainLabel: "Jharkhand Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: jh2055.amounts.map((m, i) => {
    const cap = jh4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand 22 Home, Jail and Disaster Management (Home Division) — MIXED. Quieter. */
export const jhDemand22: LineItem = {
  id: "jh-d22-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand 22 Home, Jail and Disaster Management (Home Division) — net total",
  head: "demand-22-home",
  amounts: [fromLakhs(908106.1, "be", "2026-27")],
};

export const JH_HEADLINE_YEAR = "2026-27";
export const JH_HEADLINE_SERIES: Series = "be";
