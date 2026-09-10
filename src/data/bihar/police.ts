import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "br-afs-2026-27";
const CITE_DEMAND = "br-dfg-2026-27";

/** AFS prints ₹ in lakhs (In Lacs of Rupees). Crore = (commas stripped) ÷ 100. */
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

/** AFS Statement I Revenue disbursements printed p.5 — 2055 Police. Not jails 2056. */
export const br2055: LineItem = {
  id: "br-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement I revenue (lakhs, converted to crore)",
  head: "2055",
  amounts: four("1109665.32", "1409383.53", "1431432.63", "1567106.81"),
};

/** AFS Statement I Capital disbursements printed p.10 — 4055 Capital Outlay on Police. */
export const br4055: LineItem = {
  id: "br-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement I capital",
  head: "4055",
  amounts: four("72711.96", "55890.99", "118115.20", "116897.17"),
};

export const brFunctional: LineItem = {
  id: "br-functional",
  plainLabel: "Bihar Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: br2055.amounts.map((m, i) => {
    const cap = br4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

/** Demand 22 Home — MIXED (jails, public works, other Home). Quieter. */
export const brDemand22: LineItem = {
  id: "br-d22-home",
  plainLabel: "Home grant (not only police)",
  officialName: "Demand 22 Home Department — revenue + capital voted",
  head: "demand-22-home",
  amounts: [fromLakhs("2013286.69", "be", "2026-27", CITE_DEMAND)],
};

export const BR_HEADLINE_YEAR = "2026-27";
export const BR_HEADLINE_SERIES: Series = "be";
