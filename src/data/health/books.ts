import type { LineItem, Money, Series } from "../maharashtra-police";
import { fromLakhString, sumItems } from "../telangana/health";

/**
 * One state's Health book: 2210 + 2211 (running) and 4210 + 4211 (buildings),
 * typed from that state's Annual Financial Statement major-head tables.
 * Every rupee is verified on the printed page image, not just PDF text.
 */
export type HealthBook = {
  slug: string;
  citationId: string;
  /** Printed unit, for the page caption. */
  unit: string;
  bookName: string;
  run2210: LineItem;
  run2211: LineItem;
  cap4210: LineItem;
  /** Omitted when the book prints no 4211 row (or prints it blank/zero). */
  cap4211?: LineItem;
  run: LineItem;
  cap: LineItem;
  functional: LineItem;
  /** What the printed Total (b) row shows, when the book prints one — a test locks run/cap to it. */
  printedRunTotal?: Money[];
  printedCapTotal?: Money[];
  note: string;
};

type Col = [fiscalYear: string, series: Series];
const COLS: Col[] = [
  ["2024-25", "actual"],
  ["2025-26", "be"],
  ["2025-26", "re"],
  ["2026-27", "be"],
];

/** Rupees in thousands printed with Indian commas, e.g. "48,82,46,00". */
function fromThousandsStr(printed: string, series: Series, fiscalYear: string, citationId: string): Money {
  const thousands = Number(printed.replaceAll(",", ""));
  if (!Number.isFinite(thousands)) throw new Error(`Bad printed thousands: ${printed}`);
  const rupees = Math.round(thousands * 1000);
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function fromLakhs(lakhs: number, series: Series, fiscalYear: string, citationId: string): Money {
  const rupees = Math.round(lakhs * 100_000);
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

function fromRupees(rupees: number, series: Series, fiscalYear: string, citationId: string): Money {
  return { crore: rupees / 10_000_000, rupees, series, fiscalYear, citationId };
}

type Conv = (printed: string | number, series: Series, fiscalYear: string, citationId: string) => Money;

const CONV: Record<"lakhStr" | "thousandsStr" | "lakhs" | "thousands" | "rupees", Conv> = {
  lakhStr: (p, s, f, c) => fromLakhString(String(p), s, f, c),
  thousandsStr: (p, s, f, c) => fromThousandsStr(String(p), s, f, c),
  lakhs: (p, s, f, c) => fromLakhs(Number(p), s, f, c),
  thousands: (p, s, f, c) => fromThousandsStr(String(p), s, f, c),
  rupees: (p, s, f, c) => fromRupees(Number(p), s, f, c),
};

/** Four printed columns in book order; `null` = not printed (blank / "..") — never ₹0. */
type Four = [string | number | null, string | number | null, string | number | null, string | number | null];

function four(conv: Conv, cite: string, vals: Four, convs?: [Conv, Conv, Conv, Conv]): Money[] {
  const out: Money[] = [];
  vals.forEach((v, i) => {
    if (v === null) return;
    const [fy, series] = COLS[i];
    out.push((convs ? convs[i] : conv)(v, series, fy, cite));
  });
  return out;
}

function item(id: string, plainLabel: string, officialName: string, head: string, amounts: Money[]): LineItem {
  return { id, plainLabel, officialName, head, amounts };
}

type Spec = {
  slug: string;
  pre: string;
  citationId: string;
  unit: string;
  bookName: string;
  conv: keyof typeof CONV;
  /** Per-column converters when a book mixes units (Kerala). */
  convs?: [keyof typeof CONV, keyof typeof CONV, keyof typeof CONV, keyof typeof CONV];
  r2210: Four;
  r2211: Four;
  c4210: Four;
  c4211?: Four;
  runTotal?: Four;
  capTotal?: Four;
  name2210?: string;
  note: string;
};

function build(s: Spec): HealthBook {
  const conv = CONV[s.conv];
  const convs = s.convs ? (s.convs.map((k) => CONV[k]) as [Conv, Conv, Conv, Conv]) : undefined;
  const f = (vals: Four) => four(conv, s.citationId, vals, convs);
  const run2210 = item(`${s.pre}-2210`, "Hospitals and public health (running)", s.name2210 ?? `2210 Medical and Public Health — ${s.bookName}`, "2210", f(s.r2210));
  const run2211 = item(`${s.pre}-2211`, "Family welfare (running)", `2211 Family Welfare — ${s.bookName}`, "2211", f(s.r2211));
  const cap4210 = item(`${s.pre}-4210`, "Hospital buildings and gear", `4210 Capital Outlay on Medical and Public Health — ${s.bookName}`, "4210", f(s.c4210));
  const cap4211 = s.c4211
    ? item(`${s.pre}-4211`, "Family welfare buildings", `4211 Capital Outlay on Family Welfare — ${s.bookName}`, "4211", f(s.c4211))
    : undefined;
  const run = sumItems(`${s.pre}-health-run`, "Running costs", `2210 + 2211 (${s.bookName})`, "health-run", [run2210, run2211]);
  // Capital: 4210 plus 4211 wherever 4211 is printed for that column.
  const cap: LineItem = {
    id: `${s.pre}-health-cap`,
    plainLabel: "Buildings and gear",
    officialName: cap4211 ? `4210 + 4211 (${s.bookName})` : `4210 (${s.bookName}; 4211 not printed)`,
    head: "health-cap",
    amounts: cap4210.amounts.map((m) => {
      const extra = cap4211?.amounts.find((a) => a.fiscalYear === m.fiscalYear && a.series === m.series);
      return extra
        ? { ...m, crore: m.crore + extra.crore, rupees: m.rupees + extra.rupees }
        : m;
    }),
  };
  const functional = sumItems(`${s.pre}-health-functional`, "Health spending", `2210 + 2211 + 4210 + 4211 (${s.bookName})`, "health-total", [run, cap]);
  return {
    slug: s.slug,
    citationId: s.citationId,
    unit: s.unit,
    bookName: s.bookName,
    run2210,
    run2211,
    cap4210,
    cap4211,
    run,
    cap,
    functional,
    printedRunTotal: s.runTotal ? f(s.runTotal) : undefined,
    printedCapTotal: s.capTotal ? f(s.capTotal) : undefined,
    note: s.note,
  };
}

export const healthBooks: HealthBook[] = [
  build({
    slug: "kerala",
    pre: "kl",
    citationId: "kl-afs-2026-27",
    unit: "accounts in rupees; estimates in thousands",
    bookName: "AFS 2026-27 Statements B and C",
    conv: "thousands",
    convs: ["rupees", "thousands", "thousands", "thousands"],
    r2210: [96313044469, 101339845, 100076663, 123239786],
    r2211: [5972454077, 4462440, 4408702, 5084564],
    c4210: [3155015258, 2937407, 3500100, 3135606],
    note: "Statement B pp. 26–27 and Statement C pp. 38–39, Total column (voted + charged). 4211 is printed blank in every column and is not typed.",
  }),
  build({
    slug: "andhra-pradesh",
    pre: "ap",
    citationId: "ap-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS Volume I 2026-27 Statements D and E",
    conv: "lakhStr",
    r2210: ["10224,95.39", "12486,77.22", "11815,17.11", "12618,92.19"],
    r2211: ["3723,15.74", "4392,64.27", "3913,04.51", "3945,39.10"],
    c4210: ["1092,74.77", "2700,57.83", "1965,55.92", "2742,19.44"],
    c4211: ["22,22.44", "9,38.60", "115,38.61", "323,45.75"],
    runTotal: ["13948,11.13", "16879,41.49", "15728,21.62", "16564,31.29"],
    capTotal: ["1114,97.21", "2709,96.43", "2080,94.53", "3065,65.19"],
    note: "Statement D p. 17 and Statement E p. 22. Desk-sums equal the printed Total (b) rows.",
  }),
  build({
    slug: "manipur",
    pre: "mn",
    citationId: "mn-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement I",
    conv: "lakhs",
    r2210: [114037.69, 124506.64, 144270.7, 131482.99],
    r2211: [3278.17, 5835.88, 6363.35, 4692.7],
    c4210: [2063.67, 5366.69, 6900.19, 6088.0],
    c4211: [19.68, 70.0, 70.0, 70.0],
    runTotal: [117315.86, 130342.52, 150634.05, 136175.69],
    note: "Revenue p. 8 and capital p. 11. Running desk-sum equals the printed Total: Health and Family Welfare.",
  }),
  build({
    slug: "nagaland",
    pre: "nl",
    citationId: "nl-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement I",
    conv: "lakhs",
    r2210: [84678.4, 87881.5, 88279.89, 67304.88],
    r2211: [4526.18, 8729.44, 4912.85, 5200.0],
    c4210: [5323.37, 5307.7, 17673.99, 23188.67],
    note: "Revenue p. 6 and capital p. 8. No 4211 row is printed.",
  }),
  build({
    slug: "tripura",
    pre: "tr",
    citationId: "tr-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement I (net of recoveries)",
    conv: "lakhs",
    r2210: [100015.7107, 116999.74, 133337.65, 120071.72],
    r2211: [41499.4017, 60218.5, 52148.99, 55681.13],
    c4210: [4204.856, 8462.95, 10618.67, 9076.56],
    c4211: [3670.2875, 3274.0, 9032.53, 10421.67],
    runTotal: [141515.1123, 177218.24, 185486.64, 175752.85],
    capTotal: [7875.1435, 11736.95, 19651.2, 19498.23],
    note: "Revenue p. 23, capital pp. 30–31. Net lines (gross minus recovery), the same basis as Tripura Police. Desk-sums equal the printed net totals to within ₹10 (the book rounds its own parts).",
  }),
  build({
    slug: "mizoram",
    pre: "mz",
    citationId: "mz-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement I",
    conv: "lakhs",
    r2210: [60423.56, 68267.64, 76416.89, 77057.9],
    r2211: [309.56, 2888.25, 2994.62, 3421.06],
    c4210: [14816.87, 11451.0, 15370.96, 10451.0],
    runTotal: [60733.12, 71155.89, 79411.51, 80478.96],
    note: "Revenue p. 8 and capital p. 13. No 4211 row is printed.",
  }),
  build({
    slug: "arunachal-pradesh",
    pre: "ar",
    citationId: "ar-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27",
    conv: "thousands",
    r2210: [16297949, 11420850, 19619923, 16904396],
    r2211: [299064, 31645, 8732, 10214],
    c4210: [1093511, 1114214, 443585, 27300],
    c4211: [null, 500, 500, 1000],
    runTotal: [16597013, 11452495, 19628655, 16914610],
    capTotal: [1093511, 1114714, 444085, 28300],
    note: "Revenue p. 8 and capital p. 12. 4211 is blank for Actuals 2024-25 and not typed. Desk-sums equal the printed Total (b) rows.",
  }),
  build({
    slug: "assam",
    pre: "as",
    citationId: "as-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement B (grant rows added)",
    conv: "lakhs",
    r2210: [600296.91, 698710.12, 796748.94, 656880.03],
    r2211: [39625.91, 48834.31, 49334.31, 42374.5],
    c4210: [99982.5, 142494.23, 220997.25, 200427.18],
    c4211: [null, 207.1, 207.1, 147.89],
    runTotal: [639922.82, 747544.43, 846083.25, 699254.53],
    capTotal: [99982.5, 142701.33, 221204.35, 200575.07],
    note: "The book prints each head once per grant (grants 25, 28, 29, 36, 76, 77, 78) and one Total (b). The head lines here are desk-sums of those grant rows; they equal the printed Total (b) in every column.",
  }),
  build({
    slug: "jharkhand",
    pre: "jh",
    citationId: "jh-afs-2026-27",
    unit: "lakhs",
    bookName: "AFS 2026-27 Statement I",
    conv: "lakhs",
    r2210: [371654.09, 644791.9, 683223.23, 667357.11],
    r2211: [604.9, 812.94, 817.38, 820.15],
    c4210: [43970.56, 102464.56, 85208.16, 131560.01],
    runTotal: [372258.99, 645604.84, 684040.61, 668177.26],
    note: "Revenue p. 7 and capital p. 14. BE 2026-27 is the printed Total column (establishment + state + central schemes). No 4211 row is printed.",
  }),
  build({
    slug: "punjab",
    pre: "pb",
    citationId: "pb-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27 Statement I",
    conv: "thousandsStr",
    r2210: ["48,82,46,00", "57,71,12,19", "60,36,01,53", "71,06,84,54"],
    r2211: ["2,64,35,81", "2,54,83,39", "2,35,24,58", "2,46,87,07"],
    c4210: ["2,83,60,97", "6,33,64,01", "4,10,78,02", "4,33,23,03"],
    runTotal: ["51,46,81,81", "60,25,95,58", "62,71,26,11", "73,53,71,61"],
    note: "Revenue p. 16 and capital p. 24. No 4211 row is printed.",
  }),
  build({
    slug: "uttarakhand",
    pre: "uk",
    citationId: "uk-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27 Volume 2 Part 1 (major-head totals)",
    conv: "thousands",
    r2210: [37349972, 43819891, 43638449, 44141445],
    r2211: [1331363, 1680252, 1681227, 1739702],
    c4210: [1606559, 1975167, 3296337, 3278425],
    c4211: [null, 1, 1, null],
    note: "The printed योग (total) row under each major head. 4211 prints a token ₹1 thousand for 2025-26 and zero elsewhere; zeros are not typed.",
  }),
  build({
    slug: "haryana",
    pre: "hr",
    citationId: "hr-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27 General Abstract 2-D",
    conv: "thousands",
    r2210: [69453396, 80543292, 89038976, 94496168],
    r2211: [3231543, 3647500, 3629900, 4123500],
    c4210: [13394878, 12544700, 13738084, 29779400],
    runTotal: [72684939, 84190792, 92668876, 98619668],
    note: "Revenue p. 14 and capital p. 18. 4211 is printed as 0 in every column and is not typed.",
  }),
  build({
    slug: "meghalaya",
    pre: "ml",
    citationId: "ml-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27",
    conv: "thousandsStr",
    r2210: ["16,27,92,14", "19,70,38,56", "19,70,38,56", "22,20,38,29"],
    r2211: ["76,78,82", "98,89,65", "98,89,65", "1,22,54,21"],
    c4210: ["98,77,60", "1,07,00,00", "1,07,00,00", "1,24,40,00"],
    runTotal: ["17,04,70,96", "20,69,28,21", "20,69,28,21", "23,42,92,50"],
    note: "Revenue p. 20 and capital p. 29. 4211 is printed blank and is not typed.",
  }),
  build({
    slug: "chhattisgarh",
    pre: "cg",
    citationId: "cg-afs-2026-27",
    unit: "thousands",
    bookName: "AFS 2026-27 Volume 1 (revenue and capital files)",
    conv: "thousandsStr",
    r2210: ["79,66,57,24", "91,00,58,36", "83,28,63,99", "91,03,98,78"],
    r2211: ["3,27,79,14", "4,46,53,75", "3,64,15,47", "3,93,09,51"],
    c4210: ["6,77,92,45", "16,57,41,93", "11,33,07,72", "16,54,52,04"],
    c4211: [null, null, null, "1,01,50"],
    runTotal: ["82,94,36,38", "95,47,12,11", "86,92,79,46", "94,97,08,29"],
    capTotal: ["6,77,92,45", "16,57,41,93", "11,33,07,72", "16,55,53,54"],
    note: "Revenue file p. 4; capital file p. 8 (4-capital_expenditure.pdf in the same folder). 4211 prints 0 for the first three columns and is not typed.",
  }),
];

export function getHealthBook(slug: string): HealthBook | undefined {
  return healthBooks.find((b) => b.slug === slug);
}

export const HEALTH_HEADLINE_YEAR = "2026-27";
export const HEALTH_HEADLINE_SERIES: Series = "be";
