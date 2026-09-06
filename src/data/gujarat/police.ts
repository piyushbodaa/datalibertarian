import type { LineItem, Series } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

const CITE = "gj-home-2026-27";

function four(actual: number, be25: number, re25: number, be26: number): ReturnType<typeof fromCrore>[] {
  return [
    fromCrore(actual, "actual", "2024-25", CITE),
    fromCrore(be25, "be", "2025-26", CITE),
    fromCrore(re25, "re", "2025-26", CITE),
    fromCrore(be26, "be", "2026-27", CITE),
  ];
}

function minor(
  id: string,
  plainLabel: string,
  officialName: string,
  amounts: ReturnType<typeof fromCrore>[],
): LineItem {
  return { id, plainLabel, officialName, head: "2055", parentId: "gj-2055", amounts };
}

/** Demand 043 — 2055 Police. Units crore as printed. */
export const gj2055: LineItem = {
  id: "gj-2055",
  plainLabel: "Police (running costs)",
  officialName: "2055 Police — Demand 043 (crore)",
  head: "2055",
  amounts: four(7617.4658, 8538.32, 8053.66, 9055.62),
};

/**
 * 4055 Capital outlay on Police.
 * Printed under Demand 046 (mixed Home capital), not Demand 043.
 * Isolated as Police capital — not Demand 046 total.
 */
export const gj4055: LineItem = {
  id: "gj-4055",
  plainLabel: "Police buildings and equipment (capital)",
  officialName: "4055 Capital outlay on Police (printed under Demand 046)",
  head: "4055",
  amounts: four(512.3896, 1490.25, 1212.57, 964.73),
};

export const gjFunctional: LineItem = {
  id: "gj-functional",
  plainLabel: "Gujarat Police spending",
  officialName: "2055 Police (Demand 043) + 4055 Capital outlay on Police",
  head: "total",
  amounts: gj2055.amounts.map((m, i) => {
    const cap = gj4055.amounts[i];
    return fromCrore(m.crore + cap.crore, m.series as Series, m.fiscalYear, CITE);
  }),
};

/** 2055 I-Summary minor heads — printed, Demand 043 p. 21. Sum to 2055. */
export const gj2055Minors: LineItem[] = [
  minor("gj-2055-001", "Direction and administration", "001 Direction and Administration", four(42.0862, 46.45, 52.37, 87.81)),
  minor("gj-2055-003", "Education and training", "003 Education and Training", four(66.2598, 99.41, 60.1, 95.48)),
  minor("gj-2055-101", "Criminal investigation and vigilance", "101 Criminal Investigation and Vigilance", four(202.2673, 225.58, 216.63, 237.88)),
  minor("gj-2055-104", "Special police", "104 Special Police", four(17.7143, 22.88, 16.87, 20.84)),
  minor("gj-2055-109", "District police", "109 District Police", four(6978.8072, 7754.98, 7322.41, 8242.91)),
  minor("gj-2055-111", "Railway police", "111 Railway Police", four(135.2399, 147.6, 149.08, 147.65)),
  minor("gj-2055-113", "Welfare of police personnel", "113 Welfare of Police Personnel", four(41.3822, 60.52, 59.52, 65.55)),
  minor("gj-2055-114", "Wireless and computers", "114 Wireless and Computers", four(9.1413, 12.53, 9.14, 10.92)),
  minor("gj-2055-115", "Modernisation of police force", "115 Modernisation of Police Force", four(0.0478, 0.05, 0.05, 0.31)),
  minor("gj-2055-116", "Forensic science", "116 Forensic Science", four(67.1392, 115.27, 88, 117.17)),
  minor("gj-2055-800", "Other expenditure", "800 Other Expenditure", four(57.3806, 53.05, 79.49, 29.1)),
];

export const GJ_HEADLINE_YEAR = "2026-27";
export const GJ_HEADLINE_SERIES: Series = "be";
