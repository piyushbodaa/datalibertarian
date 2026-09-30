// Site-wide search over published records and pages. The index is built by
// scripts/search-index.ts into /search-index.json; budget lines and inflation
// items come from searchIndex.ts. Matching is word by word: every word of the
// query must appear somewhere in a result, so "Maharashtra salaries" finds
// salary lines in Maharashtra's books, and "UP" also matches "Uttar Pradesh".

export type RecordKind = "court" | "register" | "enterprise";
export type SiteRecord = {
  kind: RecordKind; section: string; title: string; text: string; href: string;
  state: string; place: string; topic: string; by: string; date: string; year: number | null;
};
export type SitePage = { title: string; text: string; href: string };
export type SiteIndex = { built: string; records: SiteRecord[]; pages: SitePage[] };

/** Common short forms, matched as whole words only. */
export const ALIASES: Record<string, string[]> = {
  up: ["uttar pradesh"], mp: ["madhya pradesh"], ap: ["andhra pradesh"], hp: ["himachal pradesh"],
  mh: ["maharashtra"], tn: ["tamil nadu"], wb: ["west bengal"], ka: ["karnataka"], kl: ["kerala"],
  tg: ["telangana"], ts: ["telangana"], gj: ["gujarat"], rj: ["rajasthan"], pb: ["punjab"], hr: ["haryana"],
  br: ["bihar"], jh: ["jharkhand"], od: ["odisha"], orissa: ["odisha"], cg: ["chhattisgarh"],
  uk: ["uttarakhand"], ga: ["goa"], jk: ["jammu and kashmir"], "j&k": ["jammu and kashmir"],
  ncr: ["delhi"], nct: ["delhi"], bombay: ["mumbai"], madras: ["chennai"], calcutta: ["kolkata"],
  bangalore: ["bengaluru"], centre: ["union"], central: ["union"], cbi: ["central bureau of investigation"],
  psu: ["psus", "public sector"], psus: ["public sector"], salary: ["salaries"], salaries: ["salary"],
  cop: ["police"], cops: ["police"], bribe: ["bribery"], bribery: ["bribe"],
};

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Split a query into words; each word is a list of acceptable spellings. */
export function queryTerms(query: string): string[][] {
  return norm(query)
    .split(/[\s,;]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}&]+|[^\p{L}\p{N}&]+$/gu, ""))
    .filter((w) => w.length > 0)
    .map((w) => [w, ...(ALIASES[w] ?? [])]);
}

const escRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = new Map<string, RegExp>();

/** Short words (up to 3 letters, like "up") must be a whole word; longer ones match a word's start. */
function hasWord(hay: string, word: string): boolean {
  let re = wordRe.get(word);
  if (!re) {
    const tail = word.length <= 3 ? "($|[^\\p{L}\\p{N}])" : "";
    re = new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(word)}${tail}`, "u");
    wordRe.set(word, re);
  }
  return re.test(hay);
}

/** 0 = no match. Higher is better: title hits count more than body hits. */
export function score(terms: string[][], title: string, body: string): number {
  if (!terms.length) return 0;
  const t = norm(title);
  const b = norm(body);
  let s = 0;
  for (const alts of terms) {
    if (alts.some((w) => hasWord(t, w))) s += 3;
    else if (alts.some((w) => hasWord(b, w))) s += 1;
    else return 0;
  }
  return s;
}

export type Filters = { state?: string; year?: number; section?: string };

export function searchRecords(index: SiteIndex, query: string, f: Filters = {}) {
  const terms = queryTerms(query);
  const out: { r: SiteRecord; s: number }[] = [];
  for (const r of index.records) {
    if (f.state && r.state !== f.state) continue;
    if (f.year && r.year !== f.year) continue;
    if (f.section && r.section !== f.section) continue;
    const s = score(terms, r.title, `${r.section} ${r.state} ${r.place} ${r.topic} ${r.by} ${r.text}`);
    if (s) out.push({ r, s });
  }
  return out.sort((a, b) => b.s - a.s || b.r.date.localeCompare(a.r.date)).map((x) => x.r);
}

export function searchPages(index: SiteIndex, query: string) {
  const terms = queryTerms(query);
  return index.pages
    .map((p) => ({ p, s: score(terms, p.title, `${p.text} ${p.href.replaceAll("-", " ").replaceAll("/", " ")}`) }))
    .filter((x) => x.s)
    .sort((a, b) => b.s - a.s || a.p.title.length - b.p.title.length)
    .map((x) => x.p);
}

/** Facet counts for the records that match the query (before filters). */
export function facets(records: SiteRecord[]) {
  const count = (key: (r: SiteRecord) => string | number | null) => {
    const m = new Map<string, number>();
    for (const r of records) { const k = key(r); if (k !== null && k !== "") m.set(String(k), (m.get(String(k)) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  return { section: count((r) => r.section), state: count((r) => r.state), year: count((r) => r.year).sort((a, b) => Number(b[0]) - Number(a[0])) };
}
