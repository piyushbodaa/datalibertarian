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
      { href: "/babuwatch", name: "Babuwatch", what: "Court findings against public servants" },
      { href: "/civilliberties", name: "Civil Liberties", what: "People punished for speech, religion and other basic freedoms" },
      { href: "/victimlesscrimes", name: "Victimless Crimes", what: "Prosecutions for acts with no complaining victim" },
      { href: "/economicfreedom", name: "Economic Freedom", what: "Raids and penalties for peaceful economic acts" },
    ],
  },
  {
    title: "Crime",
    items: [
      { href: "/crime", name: "Crime in India", what: "Every head, 2022 to 2024, from NCRB tables" },
      { href: "/crime/rape", name: "Rape", what: "FIRs, including child rape under POCSO" },
      { href: "/crime/murder", name: "Murder", what: "Cases and their motives" },
      { href: "/crime/stealing", name: "Theft and robbery", what: "Thefts, robberies and where they were registered" },
    ],
  },
  {
    title: "Public money",
    items: [
      { href: "/spending", name: "Spending", what: "Union, state, city and village budgets" },
      { href: "/states", name: "State police budgets", what: "What each state's own books print for its police" },
      { href: "/compare", name: "Compare two governments", what: "Side by side, where the accounting scope matches" },
      { href: "/psu", name: "PSUs", what: "Businesses the government owns" },
    ],
  },
  {
    title: "Prices",
    items: [{ href: "/inflation", name: "Inflation", what: "Official price indices and retail prices" }],
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

/** The bar as static HTML for the page at `path`. */
export function renderSiteNav(path: string): string {
  const here = currentItem(path);
  const groups = SITE_NAV.map((g) => {
    const links = g.items
      .map((i) => {
        const on = here === i;
        return `<li><a href="${i.href}"${on ? ' aria-current="page"' : ""}><b>${esc(i.name)}</b><span>${esc(i.what)}</span></a></li>`;
      })
      .join("");
    return `<div class="dl-nav-group"><h2>${esc(g.title)}</h2><ul>${links}</ul></div>`;
  }).join("");
  const section = here ? `<span class="dl-nav-here" aria-hidden="true">${esc(here.name)}</span>` : "";
  return (
    SITE_NAV_MARK +
    `<div class="dl-nav" role="navigation" aria-label="Data Libertarian"><div class="dl-nav-in">` +
    `<a class="dl-nav-brand" href="/">Data Libertarian</a>${section}` +
    `<details class="dl-nav-explore"><summary>Explore</summary><div class="dl-nav-panel">${groups}` +
    `<p class="dl-nav-foot"><a href="/by-state">Browse by state</a><a href="/">All projects on the home page</a><a href="/corrections">Report a correction</a></p></div></details>` +
    `<a class="dl-nav-link" href="/by-state"${path === "/by-state" || STATE_SLUGS.has(path.slice(1)) ? ' aria-current="page"' : ""}>States</a>` +
    `<form class="dl-nav-search" role="search" action="/search" method="get"><label for="dl-nav-q" class="dl-nav-sr">Search the site</label>` +
    `<input id="dl-nav-q" name="q" type="search" placeholder="Search" enterkeyhint="search"></form>` +
    `</div></div>`
  );
}

/** Insert the bar at the top of a full HTML page, after a leading skip link. */
export function injectSiteNav(html: string, path: string): string {
  if (html.includes(SITE_NAV_MARK) || !/<body[^>]*>/i.test(html)) return html;
  const assets = '<link rel="stylesheet" href="/site-nav.css"><script src="/site-nav.js" defer></script>';
  const withHead = html.replace(/<\/head>/i, assets + "</head>");
  const skip = /(<body[^>]*>\s*<a [^>]*class="(?:skip|skip-link)"[^>]*>[\s\S]*?<\/a>)/i;
  if (skip.test(withHead)) return withHead.replace(skip, (m) => m + renderSiteNav(path));
  return withHead.replace(/(<body[^>]*>)/i, (m) => m + renderSiteNav(path));
}
