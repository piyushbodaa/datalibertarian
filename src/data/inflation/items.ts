import type { InflationItem, OfficialIndex, PricePoint } from "./types";

const PMD = "pmd-retail-2026-09-10";
const PPAC = "ppac-fuel-2026-09-10";
const MOSPI = "mospi-cpi-2026-07";

function pmdKg(rupees: number, asOf: string): PricePoint {
  return { rupees, unit: "kg", asOf, centre: "all-india", citationId: PMD };
}

function pmdLtr(rupees: number, asOf: string): PricePoint {
  return { rupees, unit: "litre", asOf, centre: "all-india", citationId: PMD };
}

function threeKg(now: number, month: number, year: number): PricePoint[] {
  return [pmdKg(now, "2026-09-10"), pmdKg(month, "2026-08-10"), pmdKg(year, "2025-09-10")];
}

function threeLtr(now: number, month: number, year: number): PricePoint[] {
  return [pmdLtr(now, "2026-09-10"), pmdLtr(month, "2026-08-10"), pmdLtr(year, "2025-09-10")];
}

function cpiItem(label: string, yoyPct: number): OfficialIndex {
  return { period: "2026-07", yoyPct, citationId: MOSPI, label };
}

/**
 * All-India average retail, PMD daily report as on 10/09/2026.
 * Month/year columns are printed on that same report (10/08/2026 and 10/09/2025).
 * Additional commodities print only the day — no YoY until a second date is typed.
 */
export const INFLATION_ITEMS: InflationItem[] = [
  {
    id: "rice",
    plainLabel: "Rice",
    officialName: "Rice — PMD all-India average retail",
    category: "grains",
    observed: threeKg(46.34, 45.38, 43.03),
  },
  {
    id: "wheat",
    plainLabel: "Wheat",
    officialName: "Wheat — PMD all-India average retail",
    category: "grains",
    observed: threeKg(31.8, 31.54, 31.72),
  },
  {
    id: "atta",
    plainLabel: "Atta",
    officialName: "Atta (Wheat) — PMD all-India average retail",
    category: "grains",
    observed: threeKg(37.43, 37.35, 37.04),
  },
  {
    id: "gram-dal",
    plainLabel: "Gram dal",
    officialName: "Gram Dal — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(87.88, 86.93, 87.27),
  },
  {
    id: "tur-dal",
    plainLabel: "Tur / arhar dal",
    officialName: "Tur/Arhar Dal — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(124.08, 123.56, 116.15),
  },
  {
    id: "urad-dal",
    plainLabel: "Urad dal",
    officialName: "Urad Dal — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(122.77, 121.83, 113.87),
  },
  {
    id: "moong-dal",
    plainLabel: "Moong dal",
    officialName: "Moong Dal — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(112.04, 112, 110.28),
  },
  {
    id: "masoor-dal",
    plainLabel: "Masoor dal",
    officialName: "Masoor Dal — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(90.5, 90.48, 89.46),
  },
  {
    id: "groundnut-oil",
    plainLabel: "Groundnut oil",
    officialName: "Groundnut Oil (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(209.47, 206.8, 187.69),
  },
  {
    id: "mustard-oil",
    plainLabel: "Mustard oil",
    officialName: "Mustard Oil (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(202.01, 197.53, 188.79),
  },
  {
    id: "vanaspati",
    plainLabel: "Vanaspati",
    officialName: "Vanaspati (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(168.21, 166.12, 156.42),
  },
  {
    id: "soya-oil",
    plainLabel: "Soya oil",
    officialName: "Soya Oil (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(166.28, 164.57, 147.57),
  },
  {
    id: "sunflower-oil",
    plainLabel: "Sunflower oil",
    officialName: "Sunflower Oil (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(193.04, 190.18, 162.32),
  },
  {
    id: "palm-oil",
    plainLabel: "Palm oil",
    officialName: "Palm Oil (Packed) — PMD all-India average retail",
    category: "oils",
    observed: threeKg(151.52, 148.87, 132.23),
  },
  {
    id: "potato",
    plainLabel: "Potato",
    officialName: "Potato — PMD all-India average retail",
    category: "veg",
    observed: threeKg(22.8, 22.8, 25.46),
    official: cpiItem("Potato — MoSPI CPI Combined item, July 2026", -16.56),
  },
  {
    id: "onion",
    plainLabel: "Onion",
    officialName: "Onion — PMD all-India average retail",
    category: "veg",
    observed: threeKg(53.1, 35.88, 27.88),
    official: cpiItem("Onion — MoSPI CPI Combined item, July 2026", 22.54),
  },
  {
    id: "tomato",
    plainLabel: "Tomato",
    officialName: "Tomato — PMD all-India average retail",
    category: "veg",
    observed: threeKg(39.19, 38.1, 43.36),
    official: cpiItem("Tomato — MoSPI CPI Combined item, July 2026", -4.59),
  },
  {
    id: "sugar",
    plainLabel: "Sugar",
    officialName: "Sugar — PMD all-India average retail",
    category: "sugar",
    observed: threeKg(60.2, 50.65, 46.33),
  },
  {
    id: "gur",
    plainLabel: "Gur",
    officialName: "Gur — PMD all-India average retail",
    category: "sugar",
    observed: threeKg(66.94, 60.16, 56.53),
  },
  {
    id: "milk",
    plainLabel: "Milk",
    officialName: "Milk — PMD all-India average retail (₹/ltr)",
    category: "dairy",
    observed: threeLtr(61.28, 60.62, 59.13),
  },
  {
    id: "tea",
    plainLabel: "Tea (loose)",
    officialName: "Tea Loose — PMD all-India average retail",
    category: "other",
    observed: threeKg(276.75, 275.75, 272.87),
  },
  {
    id: "salt",
    plainLabel: "Salt (iodised pack)",
    officialName: "Salt Pack (Iodised) — PMD all-India average retail",
    category: "other",
    observed: threeKg(22.35, 22.13, 21.44),
  },
  {
    id: "eggs",
    plainLabel: "Eggs",
    officialName: "Eggs — PMD all-India average retail (1 dozen)",
    category: "dairy",
    observed: [
      { rupees: 83.5, unit: "dozen", asOf: "2026-09-10", centre: "all-india", citationId: PMD },
      { rupees: 85.18, unit: "dozen", asOf: "2026-08-10", centre: "all-india", citationId: PMD },
      { rupees: 77.14, unit: "dozen", asOf: "2025-09-10", centre: "all-india", citationId: PMD },
    ],
  },
  {
    id: "bajra",
    plainLabel: "Bajra",
    officialName: "Bajra (whole) — PMD all-India average retail",
    category: "grains",
    observed: threeKg(38.61, 38.37, 37.93),
  },
  {
    id: "jowar",
    plainLabel: "Jowar",
    officialName: "Jowar (whole) — PMD all-India average retail",
    category: "grains",
    observed: threeKg(45.09, 44.7, 43.21),
  },
  {
    id: "besan",
    plainLabel: "Besan",
    officialName: "Besan — PMD all-India average retail",
    category: "pulses",
    observed: threeKg(96.48, 96.35, 96.67),
  },
  {
    id: "ghee",
    plainLabel: "Desi ghee",
    officialName: "Desi Ghee — PMD all-India average retail",
    category: "dairy",
    observed: threeKg(699.29, 696.95, 669.8),
  },
  {
    id: "brinjal",
    plainLabel: "Brinjal",
    officialName: "Brinjal — PMD all-India average retail",
    category: "veg",
    observed: threeKg(42.86, 43.78, 42.79),
  },
  {
    id: "banana",
    plainLabel: "Banana",
    officialName: "Banana — PMD all-India average retail",
    category: "veg",
    observed: threeKg(49.89, 50.53, 49.17),
  },
  {
    id: "ginger",
    plainLabel: "Ginger",
    officialName: "Ginger — PMD (250 gm as printed; 1-year cell is 0, not taken)",
    category: "veg",
    observed: [
      { rupees: 36.91, unit: "250g", asOf: "2026-09-10", centre: "all-india", citationId: PMD },
      { rupees: 37.37, unit: "250g", asOf: "2026-08-10", centre: "all-india", citationId: PMD },
    ],
  },
  {
    id: "garlic",
    plainLabel: "Garlic",
    officialName: "Garlic — PMD (250 gm as printed; 1-year cell is 0, not taken)",
    category: "veg",
    observed: [
      { rupees: 45.27, unit: "250g", asOf: "2026-09-10", centre: "all-india", citationId: PMD },
      { rupees: 43.66, unit: "250g", asOf: "2026-08-10", centre: "all-india", citationId: PMD },
    ],
  },
  {
    id: "petrol-delhi",
    plainLabel: "Petrol (Delhi)",
    officialName: "RSP of Petrol in Delhi as per IOCL outlet — PPAC",
    category: "fuel",
    observed: [
      { rupees: 102.12, unit: "litre", asOf: "2026-09-10", centre: "delhi", citationId: PPAC },
    ],
  },
  {
    id: "diesel-delhi",
    plainLabel: "Diesel (Delhi)",
    officialName: "RSP of Diesel in Delhi as per IOCL outlet — PPAC",
    category: "fuel",
    observed: [
      { rupees: 95.2, unit: "litre", asOf: "2026-09-10", centre: "delhi", citationId: PPAC },
    ],
  },
];

export const CPI_HEADLINE: OfficialIndex = {
  period: "2026-07",
  yoyPct: 4.45,
  index: 107.94,
  citationId: MOSPI,
  label: "All India CPI Combined (base 2024=100) — July 2026 provisional",
};

export const CPI_FOOD: OfficialIndex = {
  period: "2026-07",
  yoyPct: 5.52,
  citationId: MOSPI,
  label: "All India Consumer Food Price Index — July 2026 provisional",
};

export const CATEGORIES: { id: InflationItem["category"]; label: string }[] = [
  { id: "grains", label: "Grains" },
  { id: "pulses", label: "Pulses" },
  { id: "oils", label: "Oils" },
  { id: "veg", label: "Vegetables" },
  { id: "dairy", label: "Milk, eggs, ghee" },
  { id: "sugar", label: "Sugar" },
  { id: "fuel", label: "Fuel" },
  { id: "other", label: "Tea and salt" },
];

export const BOARD_IDS = [
  "rice",
  "wheat",
  "atta",
  "tur-dal",
  "onion",
  "potato",
  "tomato",
  "eggs",
  "milk",
  "sugar",
  "mustard-oil",
  "petrol-delhi",
  "diesel-delhi",
] as const;

export function getInflationItem(id: string): InflationItem | undefined {
  return INFLATION_ITEMS.find((i) => i.id === id);
}

export function itemsIn(category: InflationItem["category"]): InflationItem[] {
  return INFLATION_ITEMS.filter((i) => i.category === category);
}

export const AS_OF = "2026-09-10";
