// Adds a "Keep exploring" block to every published record page (Babuwatch
// court records and register records): more from the same state, more on the
// same topic, the state's page and its police budget. Runs after every section
// has built. Links go to lists the site already filters by URL.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { jurisdictions } from "../src/data/states";
import { esc } from "./page-shell";

const root = process.argv[2] ?? "dist";
const MARK = "<!--dl-next-->";
const slugOf = new Map(jurisdictions.map((j) => [j.name, j.slug]));
const built = (href: string) => existsSync(join(root, href.slice(1) + ".html")) || existsSync(join(root, href.slice(1), "index.html"));

type Next = { state: string; topic: string; section: string; byState: string; byTopic: string; both: string };

function block(n: Next) {
  const slug = slugOf.get(n.state);
  const police = slug === "delhi" ? "/union/delhi-police" : slug ? `/${slug}/police` : "";
  const links: [string, string][] = [];
  if (n.state && n.topic) links.push([n.both, `More ${n.topic} records from ${n.state}`]);
  if (n.state) links.push([n.byState, `All ${n.section} records from ${n.state}`]);
  if (n.topic) links.push([n.byTopic, `${n.topic} records from every state`]);
  if (slug && built(`/${slug}`)) links.push([`/${slug}`, `Everything we hold on ${n.state}: spending, crime and other registers`]);
  if (police && built(police)) links.push([police, slug === "delhi" ? "Delhi Police budget, from the Centre's books" : `${n.state}'s police budget, from its own books`]);
  return `${MARK}<section class="dl-next" aria-labelledby="dl-next-h"><div class="wrap">
<h2 id="dl-next-h">Keep exploring</h2>
<ul>${links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)} &rarr;</a></li>`).join("")}</ul>
<p>These records are listed together because they share a state or a topic. That does not mean they are connected.</p>
</div></section>
<style>.dl-next{padding:28px 0 36px;border-top:1px solid var(--line,#D9D5C8)}.dl-next h2{margin:0 0 10px;font-family:var(--serif,Georgia,serif);font-size:22px}
.dl-next ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px 28px}
.dl-next li a{display:block;padding:8px 0;border-bottom:1px solid var(--line,#D9D5C8);font-weight:600;font-size:15px}
.dl-next p{margin:12px 0 0;font-size:13.5px;color:var(--grey,#6B7280)}</style>
`;
}

async function inject(file: string, n: Next) {
  if (!existsSync(file)) return false;
  const html = await readFile(file, "utf8");
  if (html.includes(MARK)) return false;
  const at = html.lastIndexOf("<footer");
  if (at < 0) return false;
  await writeFile(file, html.slice(0, at) + block(n) + html.slice(at));
  return true;
}

let done = 0;

// Babuwatch: the published index, one row per record page.
type Bw = { id: string; tier: string; lv?: string; st: string; ca: string };
for (const r of JSON.parse(await readFile(join(root, "babuwatch/data/index.json"), "utf8")) as Bw[]) {
  const trial = r.lv === "trial" || r.tier === "trial";
  const file = join(root, "babuwatch", trial ? "trial-court" : "incident", r.id, "index.html");
  const q = (o: Record<string, string>) => "/babuwatch/tracker?" + new URLSearchParams(o).toString();
  if (await inject(file, {
    state: r.st, topic: r.ca, section: "Babuwatch",
    byState: q({ state: r.st }), byTopic: q({ category: r.ca }), both: q({ state: r.st, category: r.ca }),
  })) done++;
}

// Registers: V2 records only (the registers' publish rule).
for (const reg of ["civilliberties", "victimlesscrimes", "economicfreedom", "psu"]) {
  const data = JSON.parse(await readFile(join("registers/data", reg + ".json"), "utf8"));
  const label = Object.fromEntries((data.categories as { key: string; label: string }[]).map((c) => [c.key, c.label]));
  const name = { civilliberties: "Civil Liberties", victimlesscrimes: "Victimless Crimes", economicfreedom: "Economic Freedom", psu: "PSUs" }[reg]!;
  for (const r of data.records) {
    if (r.verification !== "V2") continue;
    const q = (o: Record<string, string>) => `/${reg}?${new URLSearchParams(o).toString()}#records`;
    if (await inject(join(root, reg, r.id + ".html"), {
      state: r.state, topic: label[r.category] ?? "", section: name,
      byState: q({ state: r.state }), byTopic: q({ cat: r.category }), both: q({ state: r.state, cat: r.category }),
    })) done++;
  }
}
console.log(`record-links: added Keep exploring to ${done} record pages`);
