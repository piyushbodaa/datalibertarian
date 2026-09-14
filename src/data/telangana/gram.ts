import type { LineItem, Money, Series } from "../maharashtra-police";
import { fromLakhString, sumItems } from "./health";

function four(actual: string, be25: string, re25: string, be26: string): Money[] {
  return [
    fromLakhString(actual, "actual", "2024-25"),
    fromLakhString(be25, "be", "2025-26"),
    fromLakhString(re25, "re", "2025-26"),
    fromLakhString(be26, "be", "2026-27"),
  ];
}

/** AFS Statement D (Revenue), printed page 11 — C(b) Rural Development. */
export const tg2515: LineItem = {
  id: "tg-2515",
  plainLabel: "Village programmes (running)",
  officialName: "2515 Other Rural Development Programmes — AFS Statement D (lakhs, converted to crore)",
  head: "2515",
  amounts: four("2492,79.14", "5718,26.82", "4632,34.69", "6227,39.05"),
};

export const tg2501: LineItem = {
  id: "tg-2501",
  plainLabel: "Special rural programmes",
  officialName: "2501 Special Programmes for Rural Development — AFS Statement D",
  head: "2501",
  amounts: four("595,86.84", "1127,38.59", "1034,45.07", "1518,46.88"),
};

export const tg2506: LineItem = {
  id: "tg-2506",
  plainLabel: "Land reforms",
  officialName: "2506 Land Reforms — AFS Statement D",
  head: "2506",
  amounts: four("17,52.81", "15,54.98", "15,54.98", "18,26.53"),
};

/** AFS Statement E (Capital), printed page 15 — C(b) Capital Account of Rural Development. */
export const tg4515: LineItem = {
  id: "tg-4515",
  plainLabel: "Village works (buildings and roads)",
  officialName: "4515 Capital Outlay on Other Rural Development Programmes — AFS Statement E",
  head: "4515",
  amounts: four("2328,36.63", "3859,52.26", "3859,52.26", "3158,23.20"),
};

/** Hero: 2515 + 4515. Not the whole PR&RD department, not MGNREGS, not panchayat cash. */
export const tgGramFunctional = sumItems(
  "tg-gram-functional",
  "Telangana rural development spending",
  "2515 Other Rural Development Programmes + 4515 Capital Outlay on Other Rural Development Programmes (AFS)",
  "gram-total",
  [tg2515, tg4515],
);

/** Printed "Total (b) Rural Development" on the revenue side = 2501 + 2506 + 2515. */
export const tgRuralRevenueTotal = sumItems(
  "tg-rural-revenue",
  "All rural development (running)",
  "2501 + 2506 + 2515 — printed Total (b), Statement D",
  "rural-run",
  [tg2501, tg2506, tg2515],
);

/** Budget in Brief table 11 — department grand total. Not the major-head number. */
export const tgPrrdDepartment: LineItem = {
  id: "tg-prrd-dept",
  plainLabel: "Panchayat Raj & Rural Development department (not only these heads)",
  officialName: "Panchayat Raj and Rural Development Department — Budget in Brief Table 11 Grand Total",
  head: "dept",
  amounts: [
    {
      crore: 33688,
      rupees: 33688 * 10_000_000,
      series: "be",
      fiscalYear: "2026-27",
      citationId: "tg-bib-2026-27",
    },
  ],
};

export const TG_GRAM_HEADLINE_YEAR = "2026-27";
export const TG_GRAM_HEADLINE_SERIES: Series = "be";
