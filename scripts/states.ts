// State landing pages: /<state-slug> for each of the 36 states and union
// territories, and /by-state listing them. Each page is a doorway to what the
// site holds for that place: spending books, crime figures, court records,
// register records and government-owned businesses. Runs after every section
// has built; it only counts and links what is published, and every crime
// figure cites the NCRB table it is copied from. Nothing is estimated.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { jurisdictions, tierLabel, type Jurisdiction, type PoliceTier } from "../src/data/states";
import { ncrb2024More, ncrb2024Rape } from "../src/data/crime/ncrb2024";
import { getCitation } from "../src/data/sources";

const root = process.argv[2] ?? "dist";
const ORIGIN = "https://datalibertarian.in";

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const num = (n: number) => n.toLocaleString("en-IN");
const one = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const built = (href: string) => existsSync(join(root, href.slice(1) + ".html")) || existsSync(join(root, href.slice(1), "index.html"));

// NCRB prints three names differently from the rest of the site.
const NCRB_NAME: Record<string, string> = {
  "Andaman and Nicobar Islands": "A&N Islands",
  "Dadra and Nagar Haveli and Daman and Diu": "D&N Haveli and Daman & Diu",
  "Jammu and Kashmir": "Jammu & Kashmir",
};

// ---- published records, counted per state
type Count = Map<string, number>;
const bump = (m: Count, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

const court: Count = new Map();
for (const r of JSON.parse(await readFile(join(root, "babuwatch/data/index.json"), "utf8")) as { st: string }[]) bump(court, r.st);

const REGISTERS = [
  { reg: "civilliberties", name: "Civil Liberties", what: "People punished for speech, religion and other basic freedoms", word: "record" },
  { reg: "victimlesscrimes", name: "Victimless Crimes", what: "Prosecutions for acts with no complaining victim", word: "record" },
  { reg: "economicfreedom", name: "Economic Freedom", what: "Raids and penalties for peaceful economic acts", word: "record" },
  { reg: "psu", name: "PSUs", what: "Businesses the government owns", word: "enterprise" },
] as const;
const regCounts: Record<string, Count> = {};
for (const { reg } of REGISTERS) {
  const m: Count = new Map();
  const data = JSON.parse(await readFile(join("registers/data", reg + ".json"), "utf8"));
  // Same rule as registers/build.py: only V2 records are published.
  for (const r of data.records) if (r.verification === "V2" && existsSync(join(root, reg, r.id + ".html"))) bump(m, r.state);
  regCounts[reg] = m;
}

// ---- rendering helpers
/** Numbered source markers: each figure links to its table; the list under the card names them. */
function citer() {
  const ids: string[] = [];
  const mark = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
    const n = ids.indexOf(id) + 1;
    const c = getCitation(id);
    return `<a class="cite" href="${esc(c.url)}" rel="nofollow noopener" title="${esc(c.title)}">${n}</a>`;
  };
  const list = () =>
    `<ol class="srcs">${ids.map((id) => { const c = getCitation(id); return `<li><a href="${esc(c.url)}" rel="nofollow noopener">${esc(c.title)}</a></li>`; }).join("")}</ol>`;
  return { mark, list };
}

type Status = "published" | "partial" | "none";
const STATUS_LABEL: Record<Status, string> = { published: "Published", partial: "Coverage incomplete", none: "Not read yet" };
const badge = (s: Status, text?: string) => `<span class="st st-${s}">${esc(text ?? STATUS_LABEL[s])}</span>`;

/** Both books read: published. Either one read or partly read: incomplete. Neither: not read. */
const moneyStatus = (a: Status, b: Status): Status => (a === "published" && b === "published" ? "published" : a === "none" && b === "none" ? "none" : "partial");
const tierStatus = (t: PoliceTier | undefined): Status => (t === "gold" ? "published" : t === "index" || t === "blocked" ? "partial" : "none");

function card(title: string, what: string, status: string, body: string, links: [string, string][]) {
  const ls = links.filter(([href]) => href.startsWith("http") || built(href.split(/[?#]/)[0]!) );
  return `<div class="door"><div class="door-top"><h3>${esc(title)}</h3>${status}</div><p class="what">${esc(what)}</p>${body}` +
    (ls.length ? `<p class="go">${ls.map(([href, label]) => `<a href="${esc(href)}">${esc(label)} &rarr;</a>`).join("")}</p>` : "") + `</div>`;
}

function shell(opts: { path: string; title: string; description: string; kicker: string; h1: string; lede: string; body: string }) {
  const url = ORIGIN + opts.path;
  return `<!DOCTYPE html>
<html lang="en">
<!--dl-state-page-->
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Data Libertarian">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/social-preview.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/babuwatch/assets/brand/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/babuwatch/assets/brand/logo-glyph-saffron.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/babuwatch/styles.css">
<style>
.doors{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:22px;align-items:start}
.door{border:1px solid var(--line);border-radius:6px;padding:18px 20px;background:#fff;display:flex;flex-direction:column}
.door-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.door h3{margin:0;font-family:var(--serif);font-size:20px;font-weight:600}
.door .what{margin:6px 0 0;color:var(--grey);font-size:14px}
.door .big{margin:14px 0 0;font-family:var(--serif);font-size:30px;font-weight:600;line-height:1.1}
.door .big small{display:block;font-family:inherit;font-size:13px;font-weight:500;color:var(--grey);margin-top:4px;font-family:Inter,system-ui,sans-serif}
.door .note{margin:10px 0 0;font-size:13.5px;color:#3A3F48}
.door .go{margin:0;padding-top:14px;display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600}
.door dl{margin:12px 0 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;font-size:14px}
.door dt{color:#3A3F48}.door dd{margin:0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}
.door dd small{font-weight:400;color:var(--grey)}
.st{flex-shrink:0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:3px 7px;border-radius:3px;white-space:nowrap}
.st-published{background:#E3EFE7;color:#1F5A3B}.st-partial{background:#F6EBD3;color:#7A5212}.st-none{background:#ECEBE6;color:#5B606A}
.cite{font-size:10.5px;font-weight:600;vertical-align:super;margin-left:3px;color:var(--slate);text-decoration:none}
.srcs{margin:12px 0 0;padding-left:18px;font-size:12px;color:var(--grey)}.srcs a{color:inherit}
.legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;font-size:13.5px;color:#3A3F48;align-items:center}
.states-grid{list-style:none;padding:0;margin:22px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 28px}
.states-grid li{border-bottom:1px solid var(--line);padding:11px 0}
.states-grid a{font-weight:600;font-size:16px}
.states-grid span{display:block;font-size:13px;color:var(--grey);margin-top:2px}
.crumbs{font-size:13px;color:var(--grey);margin-bottom:14px}.crumbs a{color:inherit}
section.block{padding:36px 0 8px}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="wrap">
    <div class="brand">
      <a class="seal" href="/" aria-label="Data Libertarian home"><img src="/babuwatch/assets/brand/logo-mark-saffron.svg" width="40" height="40" alt=""></a>
      <span class="brand-text">
        <a class="name" href="/">Data Libertarian</a>
        <a class="tagline" href="/">Browse by state</a>
      </span>
    </div>
    <nav class="links" aria-label="Primary"><a href="/by-state">All states</a><a href="/search">Search</a></nav>
    <button class="navtoggle" type="button" aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded="false">&#9776;</button>
  </div>
  <nav class="mobilenav" id="mobile-navigation" aria-label="Primary mobile"><a href="/by-state">All states</a><a href="/search">Search</a></nav>
</header>
<main id="main">
<section class="hero prototype-hero">
  <div class="wrap">
    <div class="crumbs">${opts.path === "/by-state" ? `<a href="/">Home</a> / Browse by state` : `<a href="/">Home</a> / <a href="/by-state">Browse by state</a> / ${esc(opts.h1)}`}</div>
    <div class="eyebrow">${esc(opts.kicker)}</div>
    <h1>${esc(opts.h1)}</h1>
    <p class="sub">${opts.lede}</p>
    <div class="legend"><span>What the labels mean:</span>${badge("published")} we have read the source and publish what it says ${badge("partial")} some read, more to come ${badge("none")} we have not read it yet &mdash; empty is not zero</div>
  </div>
</section>
${opts.body}
</main>
<footer>
  <div class="wrap">
    <div class="foot-base">
      Counts are of records we publish, not of everything that happened. Crime figures are cases the police registered, as the National Crime Records Bureau printed them. Every figure links to its source.
      <div class="foot-legal">&copy; 2026 Data Libertarian</div>
    </div>
  </div>
</footer>
<script src="/babuwatch/public-nav.js" defer></script>
</body>
</html>
`;
}

// ---- one state
function statePage(j: Jurisdiction) {
  const kind = j.kind === "ut" ? "Union territory" : "State";
  const nName = NCRB_NAME[j.name] ?? j.name;
  const cm = ncrb2024More.states.find((s) => s.name === nName);
  const cr = ncrb2024Rape.states.find((s) => s.name === nName);

  // Public money
  const policeHref = j.slug === "delhi" ? "/union/delhi-police" : `/${j.slug}/police`;
  // Delhi Police is paid from the Centre's books (Demand No. 51), which we have read.
  const delhi = j.slug === "delhi";
  const policeTier = delhi ? "gold" : j.tier;
  const policeLabel = delhi ? "From the Centre's book" : tierLabel(policeTier);
  const healthTier = j.heads?.health;
  const money = card(
    "Spending", "What the government's own budget books print",
    badge(moneyStatus(tierStatus(policeTier), tierStatus(healthTier))),
    `<dl><dt>Police</dt><dd>${esc(policeLabel)}</dd><dt>Health</dt><dd>${esc(tierLabel(healthTier ?? "empty"))}</dd></dl>`,
    [[policeHref, `${j.name} police budget`], [`/${j.slug}/health`, `${j.name} health budget`], ["/compare", "Compare with another government"]],
  );

  // Crime
  let crime: string;
  if (cm && cr) {
    const src = citer();
    const cite = src.mark;
    crime = card(
      "Crime", "Cases the police registered in 2024, from the National Crime Records Bureau", badge("published"),
      `<dl>
<dt>Rape (section 376)</dt><dd>${num(cr.rape)} <small>${one(cr.ratePerLakhWomen)}/lakh women</small>${cite("ncrb-cii-2024-3a2")}</dd>
<dt>Child rape (POCSO 4 &amp; 6)</dt><dd>${num(cr.childRapePocso)}${cite("ncrb-cii-2024-3a2")}</dd>
<dt>Murder</dt><dd>${num(cm.murder.y2024)} <small>${one(cm.murder.rate)}/lakh</small>${cite("ncrb-cii-2024-2a1")}</dd>
<dt>Theft</dt><dd>${num(cm.theft.cases)} <small>${one(cm.theft.rate)}/lakh</small>${cite("ncrb-cii-2024-1a4")}</dd>
<dt>Robbery</dt><dd>${num(cm.robbery.cases)}${cite("ncrb-cii-2024-1a4")}</dd>
</dl><p class="note">A registered case is a complaint written down, not a finding of guilt. The Bureau warns against comparing states on these figures alone.</p>${src.list()}`,
      [["/crime/rape#states", "Rape, state by state"], ["/crime/murder#states", "Murder, state by state"], ["/crime/stealing#states", "Theft and robbery, state by state"]],
    );
  } else {
    crime = card("Crime", "Cases the police registered, from the National Crime Records Bureau", badge("none"), `<p class="note">No row for ${esc(j.name)} in the tables we have read.</p>`, [["/crime", "Crime in India"]]);
  }

  // Court records
  const nCourt = court.get(j.name) ?? 0;
  const courtCard = card(
    "Babuwatch", "Court findings against police officers and civil servants",
    nCourt ? badge("partial", `${num(nCourt)} published`) : badge("none", "None published yet"),
    `<p class="big">${num(nCourt)}<small>court ${nCourt === 1 ? "record" : "records"} published for ${esc(j.name)}</small></p><p class="note">Coverage grows as judgments are read. A low count is not a clean record.</p>`,
    nCourt ? [[`/babuwatch/state/${j.slug}`, `${j.name} court records`]] : [["/babuwatch", "About Babuwatch"]],
  );

  const regCards = REGISTERS.map(({ reg, name, what, word }) => {
    const n = regCounts[reg]!.get(j.name) ?? 0;
    const words = n === 1 ? word : word + "s";
    return card(
      name, what, n ? badge("partial", `${num(n)} published`) : badge("none", "None published yet"),
      `<p class="big">${num(n)}<small>${words} published for ${esc(j.name)}</small></p>` +
        (n ? "" : `<p class="note">Coverage is being built state by state. None published does not mean none happened.</p>`),
      n ? [[`/${reg}?state=${encodeURIComponent(j.name)}#records`, `See ${j.name}'s ${words}`]] : [[`/${reg}`, `About ${name}`]],
    );
  });

  const totalRecords = nCourt + REGISTERS.reduce((s, { reg }) => s + (regCounts[reg]!.get(j.name) ?? 0), 0);
  const body = `
<section class="block"><div class="wrap">
  <div class="sec-head"><div class="kicker">Public money and crime</div><h2>From the government's own books</h2></div>
  <div class="doors">${money}${crime}</div>
</div></section>
<section class="block"><div class="wrap">
  <div class="sec-head"><div class="kicker">Records</div><h2>Court findings and registers</h2>
  <p>Each record is a single documented case with its source. Records in one state are not connected to each other because they share a place.</p></div>
  <div class="doors">${courtCard}${regCards.join("")}</div>
</div></section>
<section class="block"><div class="wrap"><p><a href="/search?q=${encodeURIComponent(j.name)}">Search everything that mentions ${esc(j.name)} &rarr;</a> &nbsp; <a href="/by-state">All states and union territories &rarr;</a></p></div></section>`;

  return shell({
    path: `/${j.slug}`,
    title: `${j.name} — spending, crime and court records — Data Libertarian`,
    description: `Everything Data Libertarian holds for ${j.name}: budget books, 2024 crime figures, ${totalRecords} published court and register records, and government-owned businesses. Each links to its source.`,
    kicker: kind,
    h1: j.name,
    lede: `What we hold for ${esc(j.name)}, in one place. Spending from the government's own books, crime as the police registered it, and every published court or register record. Each figure links to its source.`,
    body,
  });
}

// ---- the index
function indexPage() {
  const row = (j: Jurisdiction) => {
    const n = (court.get(j.name) ?? 0) + REGISTERS.reduce((s, { reg }) => s + (regCounts[reg]!.get(j.name) ?? 0), 0);
    const police = j.slug === "delhi" || j.tier === "gold" ? "police budget read" : "police budget not read yet";
    return `<li><a href="/${j.slug}">${esc(j.name)}</a><span>${num(n)} published ${n === 1 ? "record" : "records"} &middot; ${police} &middot; 2024 crime figures</span></li>`;
  };
  const states = jurisdictions.filter((j) => j.kind === "state");
  const uts = jurisdictions.filter((j) => j.kind === "ut");
  const body = `
<section class="block"><div class="wrap"><div class="sec-head"><div class="kicker">${states.length} states</div><h2>States</h2></div><ul class="states-grid">${states.map(row).join("")}</ul></div></section>
<section class="block"><div class="wrap"><div class="sec-head"><div class="kicker">${uts.length} union territories</div><h2>Union territories</h2></div><ul class="states-grid">${uts.map(row).join("")}</ul></div></section>`;
  return shell({
    path: "/by-state",
    title: "Browse by state — Data Libertarian",
    description: "Every state and union territory in one list: budget books, crime figures, court records and government-owned businesses for each.",
    kicker: "Browse by state",
    h1: "Pick a state or union territory",
    lede: "Each page gathers what we hold for one place: spending, crime, court findings and registers. It also says plainly what we have not read yet.",
    body,
  });
}

for (const j of jurisdictions) {
  const file = join(root, j.slug + ".html");
  if (existsSync(file) && !(await readFile(file, "utf8")).includes("<!--dl-state-page-->")) throw new Error(`/${j.slug} already exists; refusing to overwrite`);
  await writeFile(join(root, j.slug + ".html"), statePage(j));
}
await writeFile(join(root, "by-state.html"), indexPage());
console.log(`states: wrote ${jurisdictions.length} state pages and /by-state`);
