import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "ml-afs-2026-27";

/** AFS Statement D prints ₹ in thousands (Indian grouping). Crore = thousands ÷ 10,000. */
function fromThousands(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function add(a: Money, b: Money): Money {
  return {
    crore: a.crore + b.crore,
    rupees: a.rupees + b.rupees,
    series: a.series,
    fiscalYear: a.fiscalYear,
    citationId: a.citationId,
  };
}

/** 2055 Police voted + charged where printed. Charged actuals 2024-25 not printed — voted only that year. */
export const ml2055: LineItem = {
  id: "ml-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement D voted + charged (thousands, converted to crore)",
  head: "2055",
  amounts: [
    fromThousands("12,63,59,87", "actual", "2024-25"),
    add(fromThousands("13,54,01,96", "be", "2025-26"), fromThousands("16,92", "be", "2025-26")),
    add(fromThousands("13,54,01,96", "re", "2025-26"), fromThousands("16,92", "re", "2025-26")),
    add(fromThousands("13,58,43,75", "be", "2026-27"), fromThousands("16,92", "be", "2026-27")),
  ],
};

/** AFS Statement D capital — 4055 Capital Outlay on Police. Not 4059 jails/public works. */
export const ml4055: LineItem = {
  id: "ml-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement D",
  head: "4055",
  amounts: [
    fromThousands("18,83,09", "actual", "2024-25"),
    fromThousands("37,77,04", "be", "2025-26"),
    fromThousands("37,77,04", "re", "2025-26"),
    fromThousands("45,73,70", "be", "2026-27"),
  ],
};

export const mlFunctional: LineItem = {
  id: "ml-functional",
  plainLabel: "Meghalaya Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS statewide)",
  head: "total",
  amounts: ml2055.amounts.map((m, i) => {
    const cap = ml4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const ML_HEADLINE_YEAR = "2026-27";
export const ML_HEADLINE_SERIES: Series = "be";
