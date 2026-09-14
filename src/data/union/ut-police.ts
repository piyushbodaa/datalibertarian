import type { LineItem, Money, Series } from "../maharashtra-police";

/**
 * Union Territory police, from the Ministry of Home Affairs Detailed Demands for
 * Grants 2026-27 (Volume II A/B) — the printed "Total - Police (Major Head)" and
 * "Total - Capital Outlay on Police (Major Head)" rows of each UT's own demand.
 * Not Demand 51 (CAPF), not Delhi, J&K or Puducherry (those are transfers).
 */
export type UtPoliceBook = {
  slug: string;
  demand: number;
  citationId: string;
  volume: string;
  pages: string;
  run2055: LineItem;
  cap4055: LineItem;
  functional: LineItem;
  note: string;
};

/** MHA DDG prints ₹ in thousands with Indian commas, e.g. "47,46,878". */
function fromThousands(printed: string, series: Series, fiscalYear: string, citationId: string): Money {
  const thousands = Number(printed.replaceAll(",", ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad thousands: ${printed}`);
  const rupees = thousands * 1000;
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function four(cite: string, a: string, be25: string, re25: string, be26: string): Money[] {
  return [
    fromThousands(a, "actual", "2024-25", cite),
    fromThousands(be25, "be", "2025-26", cite),
    fromThousands(re25, "re", "2025-26", cite),
    fromThousands(be26, "be", "2026-27", cite),
  ];
}

type Spec = {
  slug: string;
  pre: string;
  demand: number;
  citationId: string;
  volume: string;
  pages: string;
  r: [string, string, string, string];
  c: [string, string, string, string];
  note: string;
};

function build(s: Spec): UtPoliceBook {
  const run2055: LineItem = {
    id: `${s.pre}-2055`,
    plainLabel: "Running costs",
    officialName: `2055 Police — Total - Police (Major Head), Demand ${s.demand}, MHA DDG 2026-27 ${s.volume} (thousands, converted to crore)`,
    head: "2055",
    amounts: four(s.citationId, ...s.r),
  };
  const cap4055: LineItem = {
    id: `${s.pre}-4055`,
    plainLabel: "Buildings and gear",
    officialName: `4055 Capital Outlay on Police — Total (Major Head), Demand ${s.demand}, MHA DDG 2026-27 ${s.volume}`,
    head: "4055",
    amounts: four(s.citationId, ...s.c),
  };
  const functional: LineItem = {
    id: `${s.pre}-functional`,
    plainLabel: "Police spending",
    officialName: `2055 Police + 4055 Capital Outlay on Police (Demand ${s.demand})`,
    head: "total",
    amounts: run2055.amounts.map((m, i) => ({
      ...m,
      crore: m.crore + cap4055.amounts[i].crore,
      rupees: m.rupees + cap4055.amounts[i].rupees,
    })),
  };
  return { slug: s.slug, demand: s.demand, citationId: s.citationId, volume: s.volume, pages: s.pages, run2055, cap4055, functional, note: s.note };
}

export const utPoliceBooks: UtPoliceBook[] = [
  build({
    slug: "andaman-and-nicobar-islands",
    pre: "ani",
    demand: 52,
    citationId: "mha-ddg-2026-27-vol2a",
    volume: "Volume II-A",
    pages: "A&NI pp. 28 and 198",
    r: ["47,46,878", "50,39,700", "50,64,800", "53,78,400"],
    c: ["1,42,536", "1,67,300", "1,60,900", "2,06,800"],
    note: "Total - Police (Major Head), voted. Jails 2056 and the 4059 public-works lines that follow are not taken.",
  }),
  build({
    slug: "chandigarh",
    pre: "chd",
    demand: 53,
    citationId: "mha-ddg-2026-27-vol2a",
    volume: "Volume II-A",
    pages: "Chandigarh pp. 21 and 132",
    r: ["80,86,829", "87,29,300", "92,29,300", "89,29,800"],
    c: ["2,80,415", "8,32,600", "4,79,600", "7,60,500"],
    note: "Total - Police (Major Head), voted plus ₹1,000 thousand charged in the three estimate columns. The Indian Reserve Battalion sits inside this total; jails do not.",
  }),
  build({
    slug: "dadra-and-nagar-haveli-and-daman-and-diu",
    pre: "dnhdd",
    demand: 54,
    citationId: "mha-ddg-2026-27-vol2b",
    volume: "Volume II-B",
    pages: "DNH&DD pp. 18 and 94",
    r: ["11,85,666", "11,56,500", "11,66,900", "11,97,700"],
    c: ["3,58,468", "2,03,700", "2,07,400", "2,20,600"],
    note: "Total - Police (Major Head), voted. Jails 2056 on the same page are not taken.",
  }),
  build({
    slug: "ladakh",
    pre: "ldk",
    demand: 55,
    citationId: "mha-ddg-2026-27-vol2b",
    volume: "Volume II-B",
    pages: "Ladakh pp. 30 and 140",
    r: ["24,34,265", "25,32,800", "25,65,300", "25,91,300"],
    c: ["93,834", "63,300", "52,100", "29,000"],
    note: "Total - Police (Major Head), voted. Capital is the Inspector General of Police Ladakh line under 4055 only.",
  }),
  build({
    slug: "lakshadweep",
    pre: "lkd",
    demand: 56,
    citationId: "mha-ddg-2026-27-vol2b",
    volume: "Volume II-B",
    pages: "Lakshadweep pp. 13 and 79",
    r: ["8,03,238", "7,94,400", "7,94,400", "8,47,100"],
    c: ["40,491", "57,200", "45,400", "35,300"],
    note: "Total - Police (Major Head), voted; includes Harbour Police. Jails 2056 are not taken.",
  }),
];

export function getUtPoliceBook(slug: string): UtPoliceBook | undefined {
  return utPoliceBooks.find((b) => b.slug === slug);
}

export const UT_HEADLINE_YEAR = "2026-27";
export const UT_HEADLINE_SERIES: Series = "be";
