import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "tr-afs-2026-27";

/** AFS prints ₹ in lakhs. Crore = (commas stripped) ÷ 100. */
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

/** AFS revenue disbursement — 2055 Police net (gross − recovery). Not jails 2056. */
export const tr2055: LineItem = {
  id: "tr-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS revenue net (lakhs, converted to crore)",
  head: "2055",
  amounts: four("177440.3209", "224636.8300", "248480.4900", "262214.9200"),
};

/** AFS capital — 4055 Capital Outlay on Police. */
export const tr4055: LineItem = {
  id: "tr-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS capital",
  head: "4055",
  amounts: four("1231.9451", "5111.0000", "2181.7800", "7072.0900"),
};

export const trFunctional: LineItem = {
  id: "tr-functional",
  plainLabel: "Tripura Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: tr2055.amounts.map((m, i) => {
    const cap = tr4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const TR_HEADLINE_YEAR = "2026-27";
export const TR_HEADLINE_SERIES: Series = "be";
