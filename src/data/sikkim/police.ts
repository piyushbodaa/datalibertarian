import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "sk-afs-2026-27";

/** AFS prints ₹ in thousands of rupees (e.g. 6294436). Crore = thousands ÷ 10,000. */
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

/** AFS Statement I Revenue disbursements — 2055 Police. Not jails 2056. */
export const sk2055: LineItem = {
  id: "sk-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement I revenue (thousands, converted to crore)",
  head: "2055",
  amounts: four("5771230", "6292342", "6119029", "6294436"),
};

/** AFS Statement I Capital disbursements — 4055 Capital Outlay on Police. */
export const sk4055: LineItem = {
  id: "sk-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement I capital",
  head: "4055",
  amounts: four("91711", "40961", "46828", "203149"),
};

export const skFunctional: LineItem = {
  id: "sk-functional",
  plainLabel: "Sikkim Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: sk2055.amounts.map((m, i) => {
    const cap = sk4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const SK_HEADLINE_YEAR = "2026-27";
export const SK_HEADLINE_SERIES: Series = "be";
