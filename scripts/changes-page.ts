// /changes — What changed, newest first, from src/data/changes.json
// (see scripts/changes.ts). Separates the day a record was added from the
// date of the event it records. Only records that are published now are named;
// withdrawn or held records are counted, never named.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import changes from "../src/data/changes.json" with { type: "json" };
import { esc, shell } from "./page-shell";

const root = process.argv[2] ?? "dist";
const LIST = 12;

type Pub = { title: string; href: string; event: string; eventLabel: string; place: string; outcome?: string };
const pub = new Map<string, Pub>();

const SECTIONS: Record<string, { name: string; href: string; word: [string, string] }> = {
  babuwatch: { name: "Babuwatch", href: "/babuwatch/tracker", word: ["court record", "court records"] },
  civilliberties: { name: "Civil Liberties", href: "/civilliberties", word: ["record", "records"] },
  victimlesscrimes: { name: "Victimless Crimes", href: "/victimlesscrimes", word: ["record", "records"] },
  economicfreedom: { name: "Economic Freedom", href: "/economicfreedom", word: ["record", "records"] },
  psu: { name: "PSUs", href: "/psu", word: ["enterprise", "enterprises"] },
};

// Babuwatch: the published, name-gated index only.
type Bw = { id: string; mid: string; ti: string; tier: string; lv?: string; st: string; jd: string; ou: string };
for (const r of JSON.parse(await readFile(join(root, "babuwatch/data/index.json"), "utf8")) as Bw[]) {
  const trial = r.lv === "trial" || r.tier === "trial";
  pub.set(`babuwatch:${r.mid}`, {
    title: r.ti, href: `/babuwatch/${trial ? "trial-court" : "incident"}/${encodeURIComponent(r.id)}`,
    event: r.jd, eventLabel: trial ? "Convicted" : "Judgment", place: r.st, outcome: r.ou,
  });
}
// Registers: V2 records with a built page.
for (const reg of ["civilliberties", "victimlesscrimes", "economicfreedom", "psu"]) {
  const data = JSON.parse(await readFile(join("registers/data", reg + ".json"), "utf8"));
  for (const r of data.records) {
    if (r.verification !== "V2" || !existsSync(join(root, reg, r.id + ".html"))) continue;
    pub.set(`${reg}:${r.id}`, {
      title: r.title ?? r.name, href: `/${reg}/${r.id}`, event: r.date,
      eventLabel: reg === "psu" ? "As of" : (r.date_label || "Latest step"), place: r.state,
    });
  }
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m! - 1]} ${y}`; };
const short = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? ""); return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]!.slice(0, 3)} ${m[1]}` : iso ?? ""; };
const plural = (n: number, [one, many]: [string, string]) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
const titleCase = (s: string) => s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

function item(key: string, extra = "") {
  const p = pub.get(key);
  if (!p) return "";
  return `<li><a href="${esc(p.href)}">${esc(p.title)}</a><span>${esc(p.eventLabel.length > 40 ? "Event" : p.eventLabel)}: ${esc(short(p.event))}${p.place ? ` &middot; ${esc(p.place)}` : ""}${extra}</span></li>`;
}

function daySection(d: (typeof changes.days)[number]) {
  const parts: string[] = [];
  for (const [sec, meta] of Object.entries(SECTIONS)) {
    const added = ((d.added as Record<string, string[]>)[sec] ?? []).map((id) => `${sec}:${id}`).filter((k) => pub.has(k));
    const withdrawn = ((d.withdrawn as Record<string, string[]>)[sec] ?? []).length;
    const outcome = ((d.outcome as Record<string, { id: string; from: string; to: string }[]>)[sec] ?? []).filter((o) => pub.has(`${sec}:${o.id}`));
    if (!added.length && !withdrawn && !outcome.length) continue;
    const bits: string[] = [];
    if (added.length) {
      const sorted = added.sort((a, b) => (pub.get(b)!.event ?? "").localeCompare(pub.get(a)!.event ?? ""));
      bits.push(`<h4>${plural(added.length, meta.word)} added</h4><ul class="chg">${sorted.slice(0, LIST).map((k) => item(k)).join("")}</ul>` +
        (added.length > LIST ? `<p class="more"><a href="${meta.href}">and ${plural(added.length - LIST, meta.word)} more in ${esc(meta.name)} &rarr;</a></p>` : ""));
    }
    if (outcome.length) {
      bits.push(`<h4>${plural(outcome.length, ["outcome", "outcomes"])} updated</h4><ul class="chg">${outcome.slice(0, LIST).map((o) => item(`${sec}:${o.id}`, ` &middot; ${esc(titleCase(o.from))} &rarr; ${esc(titleCase(o.to))}`)).join("")}</ul>`);
    }
    if (withdrawn) {
      bits.push(`<p class="wd">${plural(withdrawn, meta.word)} withdrawn or held back for checking. Held records are not named.</p>`);
    }
    parts.push(`<div class="chg-sec"><h3><a href="${meta.href}">${esc(meta.name)}</a></h3>${bits.join("")}</div>`);
  }
  if (d.books.length) {
    const links = d.books.map((b) => {
      const [slug, head] = b.split(":") as [string, string];
      const href = `/${slug}/${head}`;
      const name = slug.split("-").map((w) => (w === "and" ? w : w[0]!.toUpperCase() + w.slice(1))).join(" ");
      return `<li><a href="${esc(href)}">${esc(name)} ${head}</a></li>`;
    });
    parts.push(`<div class="chg-sec"><h3><a href="/spending">Spending</a></h3><h4>${plural(d.books.length, ["budget book", "budget books"])} read</h4><ul class="chg chg-books">${links.join("")}</ul></div>`);
  }
  if (!parts.length) return "";
  return `<section class="block chg-day" id="d-${d.date}"><div class="wrap"><div class="sec-head"><div class="kicker">Added on</div><h2>${long(d.date)}</h2></div>${parts.join("")}</div></section>`;
}

const style = `<style>
.chg-sec{margin-top:22px;padding-top:14px;border-top:1px solid var(--line)}
.chg-sec h3{margin:0 0 6px;font-family:var(--serif);font-size:19px}.chg-sec h3 a{color:inherit}
.chg-sec h4{margin:12px 0 6px;font-size:12.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--grey)}
.chg{list-style:none;margin:0;padding:0}.chg li{padding:7px 0;border-bottom:1px solid #EDEAE1}
.chg li a{font-weight:600}.chg li span{display:block;font-size:13px;color:var(--grey);margin-top:2px}
.chg-books{display:flex;flex-wrap:wrap;gap:4px 18px}.chg-books li{border:0;padding:3px 0}
.more,.wd{font-size:14px;margin:8px 0 0}.wd{color:#3A3F48}
</style>`;

const body = changes.days.map(daySection).join("");
const html = shell({
  path: "/changes",
  title: "What changed — Data Libertarian",
  description: "New records, updated outcomes, withdrawals and newly read budget books, newest first. The day something was added is kept apart from the date of the event it records.",
  kicker: "What changed",
  h1: "What changed",
  lede: "New records, updated outcomes, withdrawals and newly read budget books, newest first. Each day is when we added it; each record shows the date of the event itself, which can be much earlier.",
  body,
  section: { name: "What changed", links: [["/changes", "What changed"], ["/search", "Search"], ["/by-state", "States"]] },
  crumbs: [["/", "Home"], ["", "What changed"]],
  footNote: "Dates are when a change reached the site's published data, read from the site's own history. Records withdrawn or held back for checking are counted but never named.",
}).replace("</head>", style + "</head>");

await writeFile(join(root, "changes.html"), html);
console.log(`changes: /changes with ${changes.days.length} days`);
