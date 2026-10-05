// Builds dist/search-index.json for the site-wide search at /search.
// Runs after every section has built, and indexes only what is published:
//  - Babuwatch records from its published, name-gated index.json;
//  - register records that pass the registers' publish rule (V2) AND have a
//    built page, so a held record can never reach search;
//  - every other built page, by its <title>.
// Budget lines and inflation items are searched in the app (src/lib/searchIndex.ts).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { SiteIndex, SiteRecord, SitePage } from "../src/lib/siteSearch";

const root = process.argv[2] ?? "dist";
const snip = (s: string | null | undefined, n = 180) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
};
const year = (d: string | null | undefined) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

const records: SiteRecord[] = [];

// Babuwatch: published index, gated display text only.
type Bw = { id: string; ti: string; su: string; tier: string; lv?: string; st: string; di?: string; co: string; ca: string; jd: string; w?: string };
const bw: Bw[] = JSON.parse(await readFile(join(root, "babuwatch/data/index.json"), "utf8"));
for (const r of bw) {
  const trial = r.lv === "trial" || r.tier === "trial";
  const href = `/babuwatch${r.w ?? ""}/${trial ? "trial-court" : "incident"}/${encodeURIComponent(r.id)}`;
  if (!existsSync(join(root, href.slice(1), "index.html")) && !existsSync(join(root, href.slice(1) + ".html"))) continue;
  records.push({
    kind: "court", section: "Babuwatch", title: r.ti, text: snip(r.su), href,
    state: r.st, place: r.di ?? "", topic: r.ca, by: r.co, date: r.jd, year: year(r.jd),
  });
}

// Registers: the same publish rule as registers/build.py, plus a built page.
const REG: Record<string, { kind: SiteRecord["kind"]; section: string }> = {
  civilliberties: { kind: "register", section: "Civil Liberties" },
  victimlesscrimes: { kind: "register", section: "Victimless Crimes" },
  economicfreedom: { kind: "register", section: "Economic Freedom" },
  psu: { kind: "enterprise", section: "PSUs" },
};
for (const [reg, meta] of Object.entries(REG)) {
  const data = JSON.parse(await readFile(join("registers/data", reg + ".json"), "utf8"));
  const cats: Record<string, string> = Object.fromEntries(
    (data.categories ?? []).map((c: { id?: string; slug?: string; key?: string; label?: string; name?: string; title?: string }) =>
      [c.id ?? c.slug ?? c.key ?? "", c.label ?? c.name ?? c.title ?? ""]));
  for (const r of data.records) {
    if (r.verification !== "V2") continue;
    if (!existsSync(join(root, reg, r.id + ".html"))) continue;
    records.push({
      kind: meta.kind, section: meta.section, title: r.title ?? r.name, text: snip(r.summary), href: `/${reg}/${r.id}`,
      state: r.state ?? "", place: r.district ?? "", topic: cats[r.category] || r.category || "",
      by: r.authority ?? r.administrative ?? "", date: r.date ?? "", year: year(r.date),
    });
  }
}

// Pages: every built page that is not a single record, by title.
async function* htmlFiles(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(full);
    else if (e.name.endsWith(".html")) yield full;
  }
}
const recordHrefs = new Set(records.map((r) => r.href.toLowerCase()));
const pages = new Map<string, SitePage>();
for await (const file of htmlFiles(root)) {
  let url = "/" + relative(root, file).split(sep).join("/");
  url = url.replace(/\.html$/, "").replace(/\/index$/, "") || "/";
  if (["/404", "/snapshot", "/search", "/"].includes(url) || recordHrefs.has(decodeURIComponent(url).toLowerCase())) continue;
  if (/^\/babuwatch\/(incident|trial-court)\//.test(url) || /^\/babuwatch\/(sin|fos)/.test(url)) continue;
  // Register record URLs include "not published" pages for held records.
  if (/^\/(civilliberties|victimlesscrimes|economicfreedom|psu)\/./.test(url)) continue;
  if (pages.has(url)) continue;
  const html = await readFile(file, "utf8");
  if (/<meta name="robots" content="noindex/.test(html)) continue;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/&amp;/g, "&").replace(/&mdash;/g, "—").replace(/&rsquo;/g, "’").trim();
  if (!title) continue;
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.replace(/&amp;/g, "&") ?? "";
  pages.set(url, { title, text: snip(desc, 160), href: url });
}

const index: SiteIndex = { built: new Date().toISOString().slice(0, 10), records, pages: [...pages.values()] };
await writeFile(join(root, "search-index.json"), JSON.stringify(index));
console.log(`search-index: ${records.length} records, ${pages.size} pages`);
