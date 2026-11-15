// The site-wide bar that sits above every section's own header. This is the
// one place the top-level menu is defined: scripts/site-nav.ts writes it into
// every built page (React, registers, Crime, Babuwatch, the homepage), and
// vite.config.ts adds it in dev. Section menus stay in their own headers.

import { jurisdictions } from "../data/states";

const STATE_SLUGS = new Set(jurisdictions.map((j) => j.slug));

export type NavItem = { href: string; name: string; what: string };
export type NavGroup = { title: string; items: NavItem[] };

export const SITE_NAV: NavGroup[] = [
  {
    title: "Courts and freedoms",
    items: [
      { href: "/babuwatch", name: "Babuwatch", what: "Court findings against officials" },
      { href: "/civilliberties", name: "Civil Liberties", what: "People punished for speech or religion" },
      { href: "/victimlesscrimes", name: "Victimless Crimes", what: "Prosecutions with no complaining victim" },
      { href: "/economicfreedom", name: "Economic Freedom", what: "Raids and penalties on peaceful economic activity" },
      { href: "/redtape", name: "Red Tape", what: "Environmental & forest clearance timelines (PARIVESH)" },
    ],
  },
  {
    title: "Crime",
    items: [
      { href: "/crime", name: "Crime in India", what: "NCRB figures, 2022 to 2024" },
      { href: "/crime/rape", name: "Rape", what: "FIRs, including child rape (POCSO)" },
      { href: "/crime/murder", name: "Murder", what: "Cases and motives" },
      { href: "/crime/stealing", name: "Theft and robbery", what: "Cases and where they were registered" },
    ],
  },
  {
    title: "Public money",
    items: [
      { href: "/spending", name: "Spending", what: "Union, state, city and village budgets" },
      { href: "/states", name: "State police budgets", what: "Each state's police budget" },
      { href: "/compare", name: "Compare two governments", what: "Side by side, like for like" },
      { href: "/psu", name: "PSUs", what: "Businesses the government owns" },
      { href: "/education", name: "Education", what: "Schools and students, from UDISE+" },
      { href: "/gov", name: "Gov.in Directory", what: "Official .gov.in websites" },
    ],
  },
  {
    title: "Prices",
    items: [{ href: "/inflation", name: "Inflation", what: "Price indices and retail prices" }],
  },
];

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** The item whose href is the longest prefix of `path`, if any. */
export function currentItem(path: string): NavItem | undefined {
  const clean = path.replace(/\/index$/, "").replace(/\/$/, "") || "/";
  let best: NavItem | undefined;
  for (const item of SITE_NAV.flatMap((g) => g.items)) {
    if (clean === item.href || clean.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}

export const SITE_NAV_MARK = "<!--dl-sitenav-->";

const SEARCH_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const searchForm = (id: string, cls: string) =>
  `<form class="${cls}" role="search" action="/search" method="get"><label for="${id}" class="dl-nav-sr">Search the site</label>` +
  `<input id="${id}" name="q" type="search" placeholder="Search" enterkeyhint="search" autocomplete="off"></form>`;

/**
 * The bar as static HTML for the page at `path`.
 *
 * Desktop: brand, five primary links, an "All datasets" menu and a search box.
 * Phones: brand, a search link and one "Menu" button. Both menus are the same
 * <details> element, so the bar works without JavaScript; site-nav.js only adds
 * Escape / click-outside closing and keeps aria-expanded in step.
 */
export function renderSiteNav(path: string): string {
  const here = currentItem(path);
  const groups = SITE_NAV.map((g) => {
    const links = g.items
      .map((i) => {
        const on = here === i;
        return `<li><a href="${i.href}"${on ? ' aria-current="page"' : ""}><b>${esc(i.name)}</b><span>${esc(i.what)}</span></a></li>`;
      })
      .join("");
    return `<div class="dl-nav-group"><p class="dl-nav-gt">${esc(g.title)}</p><ul>${links}</ul></div>`;
  }).join("");
  const isSpending =
    path === "/spending" ||
    path === "/union" ||
    path.startsWith("/union/") ||
    path === "/states" ||
    path === "/compare" ||
    path === "/municipal" ||
    path.startsWith("/municipal/") ||
    path === "/gram" ||
    path.startsWith("/trace/") ||
    path === "/sources" ||
    /^\/[^/]+\/(police|health)$/.test(path);
  const isCrime = path === "/crime" || path.startsWith("/crime/");
  const isRights = ["/babuwatch", "/civilliberties", "/victimlesscrimes", "/economicfreedom", "/redtape", "/psu"].some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const isPrices = path === "/inflation" || path.startsWith("/inflation/");
  const isStates = path === "/by-state" || STATE_SLUGS.has(path.slice(1));
  const primary: [string, string, boolean][] = [
    ["/spending", "Spending", isSpending],
    ["/crime", "Crime", isCrime],
    ["/civilliberties", "Rights", isRights],
    ["/inflation", "Prices", isPrices],
    ["/by-state", "States", isStates],
  ];
  const navLink = ([href, label, active]: [string, string, boolean]) =>
    `<a class="dl-nav-link" href="${href}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
  return (
    SITE_NAV_MARK +
    `<div class="dl-nav" role="navigation" aria-label="Site"><div class="dl-nav-in">` +
    `<a class="dl-nav-brand" href="/"><span class="dl-nav-mark" aria-hidden="true"></span><span>Data Libertarian</span></a>` +
    `<div class="dl-nav-links">${primary.map(navLink).join("")}</div>` +
    `<a class="dl-nav-searchlink" href="/search" aria-label="Search">${SEARCH_ICON}</a>` +
    `<details class="dl-nav-explore"><summary><span class="dl-nav-sum-wide">All datasets</span><span class="dl-nav-sum-narrow">Menu</span></summary>` +
    `<div class="dl-nav-panel">` +
    `<div class="dl-nav-narrow">${searchForm("dl-nav-q2", "dl-nav-search dl-nav-search-panel")}` +
    `<div class="dl-nav-primary">${primary.map(navLink).join("")}</div></div>` +
    `<div class="dl-nav-groups">${groups}</div>` +
    `<p class="dl-nav-foot"><a href="/by-state">Browse by state</a><a href="/changes">What changed</a><a href="/corrections">Report a correction</a></p>` +
    `</div></details>` +
    searchForm("dl-nav-q", "dl-nav-search dl-nav-search-bar") +
    `</div></div>`
  );
}

/** The site-wide footer: a short directory of every section, the same on every page. */
export function renderSiteFooter(): string {
  const cols = SITE_NAV.map((g) =>
    `<div><h2>${esc(g.title)}</h2><ul>${g.items.map((i) => `<li><a href="${i.href}">${esc(i.name)}</a></li>`).join("")}</ul></div>`).join("");
  const ways: [string, string][] = [
    ["/by-state", "Browse by state"], ["/search", "Search"], ["/changes", "What changed"],
    ["/sources", "Budget sources"], ["/crime/method", "Crime method"],
    ["/babuwatch/methodology", "Babuwatch method"], ["/corrections", "Report a correction"],
  ];
  return (
    `<footer class="dl-foot" aria-label="Site directory"><div class="dl-foot-in">` +
    `<div class="dl-foot-brand"><a href="/">Data Libertarian</a><p>Public records on the Indian state. Every figure links to its source. A blank means we have not read it yet, not zero.</p></div>` +
    `<div class="dl-foot-cols">${cols}<div><h2>About the data</h2><ul>${ways.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join("")}</ul></div></div>` +
    `</div></footer>`
  );
}

/** Insert the bar at the top of a full HTML page, after a leading skip link, and the directory footer at the end. */
export function injectSiteNav(html: string, path: string): string {
  if (html.includes(SITE_NAV_MARK) || !/<body[^>]*>/i.test(html)) return html;
  const assets = '<link rel="stylesheet" href="/site-nav.css"><script src="/site-nav.js" defer></script>';
  const withHead = html.replace(/<\/head>/i, assets + "</head>");
  const withFoot = withHead.replace(/<\/body>(?![\s\S]*<\/body>)/i, renderSiteFooter() + "</body>");
  const skip = /(<body[^>]*>\s*<a [^>]*class="(?:skip|skip-link)"[^>]*>[\s\S]*?<\/a>)/i;
  if (skip.test(withFoot)) return withFoot.replace(skip, (m) => m + renderSiteNav(path));
  return withFoot.replace(/(<body[^>]*>)/i, (m) => m + renderSiteNav(path));
}
