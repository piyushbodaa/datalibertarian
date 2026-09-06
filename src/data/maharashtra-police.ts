import { EXTRACT_DATE } from "./sources";

export type Series = "actual" | "be" | "re";

export type Money = {
  crore: number;
  rupees: number;
  series: Series;
  fiscalYear: string;
  citationId: string;
};

export type LineItem = {
  id: string;
  plainLabel: string;
  officialName: string;
  head: string;
  parentId?: string;
  amounts: Money[];
};

/** White Book prints rupees in thousands as e.g. 32668,96,08 */
function fromThousands(
  printed: string,
  series: Series,
  fiscalYear: string,
  citationId = "mh-home-whitebook-2026-27",
): Money {
  const thousands = Number(printed.replace(/,/g, ""));
  if (!Number.isFinite(thousands)) {
    throw new Error(`Bad thousands figure: ${printed}`);
  }
  const rupees = thousands * 1000;
  return {
    crore: rupees / 10_000_000,
    rupees,
    series,
    fiscalYear,
    citationId,
  };
}

const WB = "mh-home-whitebook-2026-27";

function four(
  actual2425: string,
  be2526: string,
  re2526: string,
  be2627: string,
): Money[] {
  return [
    fromThousands(actual2425, "actual", "2024-25", WB),
    fromThousands(be2526, "be", "2025-26", WB),
    fromThousands(re2526, "re", "2025-26", WB),
    fromThousands(be2627, "be", "2026-27", WB),
  ];
}

/** 2055 Police — net (voted + charged), White Book Demand B-1 I-Summary / Net Total-2055 */
export const police2055: LineItem = {
  id: "2055",
  plainLabel: "Police (running costs)",
  officialName: "2055, Police — Net Total",
  head: "2055",
  amounts: four("23225,58,65", "32000,27,16", "25087,43,84", "32674,96,08"),
};

/** 4055 Capital Outlay on Police — White Book Summary by Major Heads */
export const police4055: LineItem = {
  id: "4055",
  plainLabel: "Police buildings and equipment (capital)",
  officialName: "4055, Capital Outlay on Police",
  head: "4055",
  amounts: four("321,53,20", "1213,93,90", "493,22,68", "441,53,07"),
};

function addMoney(a: Money, b: Money): Money {
  if (a.series !== b.series || a.fiscalYear !== b.fiscalYear) {
    throw new Error("Cannot add money across series or years");
  }
  return {
    crore: a.crore + b.crore,
    rupees: a.rupees + b.rupees,
    series: a.series,
    fiscalYear: a.fiscalYear,
    citationId: a.citationId,
  };
}

export const functionalPolice: LineItem = {
  id: "functional-police",
  plainLabel: "Maharashtra Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police",
  head: "total",
  amounts: police2055.amounts.map((m, i) => addMoney(m, police4055.amounts[i])),
};

/** Minor heads under 2055, voted, from White Book Demand B-1 2055 I-Summary */
export const police2055Lines: LineItem[] = [
  {
    id: "2055-001",
    plainLabel: "Direction and administration",
    officialName: "001, Direction and Administration",
    head: "2055",
    parentId: "2055",
    amounts: four("115,69,71", "167,62,15", "117,29,24", "153,73,16"),
  },
  {
    id: "2055-003",
    plainLabel: "Education and training",
    officialName: "003, Education and Training",
    head: "2055",
    parentId: "2055",
    amounts: four("236,82,10", "308,39,79", "283,17,05", "342,59,65"),
  },
  {
    id: "2055-101",
    plainLabel: "Criminal investigation and vigilance",
    officialName: "101, Criminal Investigation and Vigilance",
    head: "2055",
    parentId: "2055",
    amounts: four("936,79,21", "1195,22,49", "1076,69,27", "1297,64,18"),
  },
  {
    id: "2055-105",
    plainLabel: "State border security force",
    officialName: "105, Border Security Force (voted)",
    head: "2055",
    parentId: "2055",
    amounts: four("53,74,07", "99,99,25", "48,34,54", "99,99,25"),
  },
  {
    id: "2055-108",
    plainLabel: "State headquarters police",
    officialName: "108, State Head Quarters Police (voted)",
    head: "2055",
    parentId: "2055",
    amounts: four("4064,71,09", "5206,32,97", "4557,23,61", "5357,16,15"),
  },
  {
    id: "2055-109",
    plainLabel: "District police force",
    officialName: "109, District Police Force (voted)",
    head: "2055",
    parentId: "2055",
    amounts: four("15467,28,07", "22745,71,17", "16561,81,17", "22863,52,68"),
  },
  {
    id: "2055-110",
    plainLabel: "Village police",
    officialName: "110, Village Police",
    head: "2055",
    parentId: "2055",
    amounts: four("451,40,56", "470,36,31", "469,66,06", "470,37,13"),
  },
  {
    id: "2055-111",
    plainLabel: "Railway police",
    officialName: "111, Railway Police",
    head: "2055",
    parentId: "2055",
    amounts: four("535,63,70", "651,26,86", "572,03,57", "716,21,36"),
  },
  {
    id: "2055-112",
    plainLabel: "Harbour police",
    officialName: "112, Harbour Police",
    head: "2055",
    parentId: "2055",
    amounts: four("84,83,31", "197,49,52", "126,28,70", "208,34,31"),
  },
  {
    id: "2055-113",
    plainLabel: "Welfare of police personnel",
    officialName: "113, Welfare of Police Personnel",
    head: "2055",
    parentId: "2055",
    amounts: four("255,99,79", "282,22,93", "279,89,33", "320,15,46"),
  },
  {
    id: "2055-115",
    plainLabel: "Modernisation of the police force",
    officialName: "115, Modernisation of Police Force",
    head: "2055",
    parentId: "2055",
    amounts: four("526,68,47", "146,60,06", "178,08,49", "194,27,69"),
  },
  {
    id: "2055-116",
    plainLabel: "Forensic science",
    officialName: "116, Forensic Science",
    head: "2055",
    parentId: "2055",
    amounts: four("184,68,59", "164,54,20", "446,40,40", "250,50,52"),
  },
  {
    id: "2055-117",
    plainLabel: "Internal security",
    officialName: "117, Internal Security",
    head: "2055",
    parentId: "2055",
    amounts: four("46,59,02", "17,01", "69,96", "17,01"),
  },
  {
    id: "2055-118",
    plainLabel: "Special protection group (state)",
    officialName: "118, Special Protection Group",
    head: "2055",
    parentId: "2055",
    amounts: four("266,08,16", "359,32,45", "359,32,45", "394,27,53"),
  },
];

/** Grant B-1 — not police-only. White Book Demand B-1 I-Summary Total. */
export const grantB1: LineItem = {
  id: "b1",
  plainLabel: "Home Department grant B-1 (Police Administration)",
  officialName:
    "Demand B-1 Police Administration (2014 Administration of Justice + 2055 Police + 2070 Other Administrative Services)",
  head: "B-1",
  amounts: [
    fromThousands("23962,35,80", "actual", "2024-25", WB),
    {
      ...fromThousands("32732,38,23", "be", "2025-26", WB),
      citationId: "mh-appropriation-2025-26",
      rupees: 32_732_382_3000,
    },
    fromThousands("25980,29,77", "re", "2025-26", WB),
    fromThousands("33712,81,77", "be", "2026-27", WB),
  ],
};

/** Pink Book total expenditure (revenue + capital), crore as printed. */
export const stateTotalExpenditure: Money[] = [
  {
    crore: 606809.57,
    rupees: 6_068_095_700_000,
    series: "actual",
    fiscalYear: "2024-25",
    citationId: "mh-pink-book-2026-27",
  },
  {
    crore: 700020.2,
    rupees: 7_000_202_000_000,
    series: "be",
    fiscalYear: "2025-26",
    citationId: "mh-pink-book-2026-27",
  },
  {
    crore: 755920.24,
    rupees: 7_559_202_400_000,
    series: "re",
    fiscalYear: "2025-26",
    citationId: "mh-pink-book-2026-27",
  },
  {
    crore: 769466.87,
    rupees: 7_694_668_700_000,
    series: "be",
    fiscalYear: "2026-27",
    citationId: "mh-pink-book-2026-27",
  },
];

export const HEADLINE_YEAR = "2026-27";
export const HEADLINE_SERIES: Series = "be";

export function pickAmount(
  item: LineItem,
  fiscalYear: string,
  series: Series,
): Money | undefined {
  return item.amounts.find((a) => a.fiscalYear === fiscalYear && a.series === series);
}

export const datasetMeta = {
  jurisdiction: "Maharashtra",
  extractDate: EXTRACT_DATE,
  whiteBookStatus: "used" as const,
  unitNote:
    "Home Department White Book figures are printed in thousands of rupees. This site shows crore (1 crore = 10 million rupees).",
};
