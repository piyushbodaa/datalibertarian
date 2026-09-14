import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "tg-afs-2026-27";

/**
 * Telangana AFS prints ₹ in lakhs as "9690,01.35" (9690 crore 01.35 lakh).
 * Strip the commas → lakhs. 1 lakh = ₹1,00,000. Crore = lakhs / 100.
 */
export function fromLakhString(printed: string, series: Series, fiscalYear: string, citationId = CITE): Money {
  const lakhs = Number(printed.replaceAll(",", ""));
  if (!Number.isFinite(lakhs)) throw new Error(`Bad printed lakhs: ${printed}`);
  const rupees = Math.round(lakhs * 100_000);
  return {
    crore: rupees / 10_000_000,
    rupees,
    series,
    fiscalYear,
    citationId,
  };
}

function four(actual: string, be25: string, re25: string, be26: string): Money[] {
  return [
    fromLakhString(actual, "actual", "2024-25"),
    fromLakhString(be25, "be", "2025-26"),
    fromLakhString(re25, "re", "2025-26"),
    fromLakhString(be26, "be", "2026-27"),
  ];
}

export function sumItems(id: string, plainLabel: string, officialName: string, head: string, parts: LineItem[]): LineItem {
  const base = parts[0];
  return {
    id,
    plainLabel,
    officialName,
    head,
    amounts: base.amounts.map((m) => {
      const same = parts.map((p) => {
        const hit = p.amounts.find((a) => a.fiscalYear === m.fiscalYear && a.series === m.series);
        if (!hit) throw new Error(`${p.id} has no ${m.series} ${m.fiscalYear}`);
        return hit;
      });
      return {
        crore: same.reduce((s, a) => s + a.crore, 0),
        rupees: same.reduce((s, a) => s + a.rupees, 0),
        series: m.series,
        fiscalYear: m.fiscalYear,
        citationId: m.citationId,
      };
    }),
  };
}

/** AFS Statement D (Revenue), printed page 9 — B(b) Health and Family Welfare. */
export const tg2210: LineItem = {
  id: "tg-2210",
  plainLabel: "Hospitals and public health (running)",
  officialName: "2210 Medical and Public Health — AFS Statement D (lakhs, converted to crore)",
  head: "2210",
  amounts: four("6278,71.85", "8291,28.85", "8138,53.47", "9690,01.35"),
};

export const tg2211: LineItem = {
  id: "tg-2211",
  plainLabel: "Family welfare (running)",
  officialName: "2211 Family Welfare — AFS Statement D",
  head: "2211",
  amounts: four("2655,54.96", "2478,91.60", "2319,95.32", "2359,12.85"),
};

/** AFS Statement E (Capital), printed page 14 — B(b) Health and Family Welfare. */
export const tg4210: LineItem = {
  id: "tg-4210",
  plainLabel: "Hospital buildings and gear",
  officialName: "4210 Capital Outlay on Medical and Public Health — AFS Statement E",
  head: "4210",
  amounts: four("891,70.61", "1972,24.56", "1972,24.56", "1855,89.33"),
};

/** 4211 is printed ".." for both 2025-26 columns — not typed as ₹0. */
export const tg4211: LineItem = {
  id: "tg-4211",
  plainLabel: "Family welfare buildings",
  officialName: "4211 Capital Outlay on Family Welfare — AFS Statement E",
  head: "4211",
  amounts: [
    fromLakhString("176,46.37", "actual", "2024-25"),
    fromLakhString("92,04.00", "be", "2026-27"),
  ],
};

/** Running = 2210 + 2211. Matches the printed "Total (b)" on page 9. */
export const tgHealthRun = sumItems(
  "tg-health-run",
  "Running costs",
  "2210 Medical and Public Health + 2211 Family Welfare (printed Total (b), Statement D)",
  "health-run",
  [tg2210, tg2211],
);

/**
 * Buildings = 4210 + 4211 where 4211 is printed; otherwise 4210 alone.
 * Matches the printed "Total (b)" on page 14 for every column.
 */
export const tgHealthCap: LineItem = {
  id: "tg-health-cap",
  plainLabel: "Buildings and gear",
  officialName: "4210 + 4211 Capital Outlay on Medical and Public Health / Family Welfare (printed Total (b), Statement E)",
  head: "health-cap",
  amounts: four("1068,16.98", "1972,24.56", "1972,24.56", "1947,93.33"),
};

export const tgHealthFunctional = sumItems(
  "tg-health-functional",
  "Telangana Health spending",
  "2210 + 2211 + 4210 + 4211 (AFS Statements D and E)",
  "health-total",
  [tgHealthRun, tgHealthCap],
);

/** Budget in Brief table 11 — department grand total. Not the major-head number. */
export const tgHealthDepartment: LineItem = {
  id: "tg-health-dept",
  plainLabel: "Health department (not only these heads)",
  officialName: "Health, Medical & Family Welfare Department — Budget in Brief Table 11 Grand Total",
  head: "dept",
  amounts: [
    {
      crore: 13679,
      rupees: 13679 * 10_000_000,
      series: "be",
      fiscalYear: "2026-27",
      citationId: "tg-bib-2026-27",
    },
  ],
};

export const TG_HEALTH_HEADLINE_YEAR = "2026-27";
export const TG_HEALTH_HEADLINE_SERIES: Series = "be";
