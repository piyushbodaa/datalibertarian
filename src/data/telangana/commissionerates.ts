import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

export type CpSlug =
  | "hyderabad-city"
  | "cyberabad"
  | "rachakonda"
  | "malkajgiri"
  | "future-city";

export type MissingYear = {
  fiscalYear: string;
  reason: string;
};

export type Commissionerate = {
  slug: CpSlug;
  name: string;
  hod: string;
  majorHead: string;
  combined: LineItem;
  missingYears: MissingYear[];
  citationId: string;
};

function combined(
  id: string,
  officialName: string,
  amounts: ReturnType<typeof fromCrore>[],
): LineItem {
  return {
    id,
    plainLabel: "Combined establishment + schemes",
    officialName,
    head: "hod",
    amounts,
  };
}

export const commissionerates: Commissionerate[] = [
  {
    slug: "hyderabad-city",
    name: "Hyderabad City Police",
    hod: "Commissioner of City Police, Hyderabad",
    majorHead: "108",
    citationId: "tg-law-home-2026-27-hyd",
    missingYears: [],
    combined: combined(
      "hyd-city-hod",
      "Commissioner of City Police, Hyderabad — combined establishment + schemes",
      [
        fromCrore(2096.08, "be", "2025-26", "tg-law-home-2026-27-hyd"),
        fromCrore(2125.85, "be", "2026-27", "tg-law-home-2026-27-hyd"),
      ],
    ),
  },
  {
    slug: "cyberabad",
    name: "Cyberabad Police",
    hod: "Commissioner of Cyberabad Police",
    majorHead: "109",
    citationId: "tg-law-home-2026-27-cyberabad",
    missingYears: [],
    combined: combined(
      "cyberabad-hod",
      "Commissioner of Cyberabad Police — combined establishment + schemes",
      [
        fromCrore(742.57, "be", "2025-26", "tg-law-home-2026-27-cyberabad"),
        fromCrore(787.86, "be", "2026-27", "tg-law-home-2026-27-cyberabad"),
      ],
    ),
  },
  {
    slug: "rachakonda",
    name: "Rachakonda Police",
    hod: "Commissioner of Rachakonda Police",
    majorHead: "109",
    citationId: "tg-law-home-2026-27-hod",
    missingYears: [
      { fiscalYear: "2026-27", reason: "No HoD in the 2026-27 Law+Home contents. Not printed as zero." },
    ],
    combined: combined(
      "rachakonda-hod",
      "Commissioner of Rachakonda Police — combined establishment + schemes",
      [fromCrore(684.61, "be", "2025-26", "tg-law-home-2026-27-hod")],
    ),
  },
  {
    slug: "malkajgiri",
    name: "Malkajgiri Police",
    hod: "Malkajgiri Police Commissionerate",
    majorHead: "109",
    citationId: "tg-law-home-2026-27-hod",
    missingYears: [
      { fiscalYear: "2025-26", reason: "Not in the 2025-26 Law+Home contents. Not printed as zero." },
    ],
    combined: combined(
      "malkajgiri-hod",
      "Malkajgiri Police Commissionerate — combined establishment + schemes",
      [fromCrore(751.69, "be", "2026-27", "tg-law-home-2026-27-hod")],
    ),
  },
  {
    slug: "future-city",
    name: "Future City Police",
    hod: "Commissioner of Police, Future City",
    majorHead: "109",
    citationId: "tg-law-home-2026-27-hod",
    missingYears: [
      { fiscalYear: "2025-26", reason: "New HoD. Prior-year columns are nil in the book — not a station share." },
    ],
    combined: combined(
      "future-city-hod",
      "Commissioner of Police, Future City — combined establishment + schemes",
      [fromCrore(118.14, "be", "2026-27", "tg-law-home-2026-27-hod")],
    ),
  },
];

export function getCommissionerate(slug: string): Commissionerate | undefined {
  return commissionerates.find((c) => c.slug === slug);
}

/** Latest printed Budget column — never a filled-in missing year. */
export function cpHero(cp: Commissionerate) {
  const be26 = cp.combined.amounts.find((a) => a.fiscalYear === "2026-27" && a.series === "be");
  if (be26) return be26;
  const be25 = cp.combined.amounts.find((a) => a.fiscalYear === "2025-26" && a.series === "be");
  if (be25) return be25;
  throw new Error(`No printed BE for ${cp.slug}`);
}
