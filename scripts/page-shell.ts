// Shared page layout for pages the site builds from several sections' data
// (state pages, What changed). Uses the section pages' stylesheet.
export const ORIGIN = "https://datalibertarian.in";
export const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export type Status = "published" | "partial" | "none";
export const STATUS_LABEL: Record<Status, string> = { published: "Published", partial: "Coverage incomplete", none: "Not read yet" };
export const badge = (s: Status, text?: string) => `<span class="st st-${s}">${esc(text ?? STATUS_LABEL[s])}</span>`;


export type ShellOpts = {
  path: string; title: string; description: string; kicker: string; h1: string; lede: string; body: string;
  /** Masthead tagline and its section menu. */
  section: { name: string; links: [string, string][] };
  crumbs: [string, string][];
  legend?: boolean;
  footNote: string;
};

export function shell(opts: ShellOpts) {
  const url = ORIGIN + opts.path;
  const nav = opts.section.links.map(([href, label]) => `<a href="${esc(href)}"${href === opts.path ? ' class="on" aria-current="page"' : ""}>${esc(label)}</a>`).join("");
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
        <a class="tagline" href="/">${esc(opts.section.name)}</a>
      </span>
    </div>
    <nav class="links" aria-label="Primary">${nav}</nav>
    <button class="navtoggle" type="button" aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded="false">&#9776;</button>
  </div>
  <nav class="mobilenav" id="mobile-navigation" aria-label="Primary mobile">${nav}</nav>
</header>
<main id="main">
<section class="hero prototype-hero">
  <div class="wrap">
    <div class="crumbs">${opts.crumbs.map(([href, label], i) => (i === opts.crumbs.length - 1 ? esc(label) : `<a href="${esc(href)}">${esc(label)}</a>`)).join(" / ")}</div>
    <div class="eyebrow">${esc(opts.kicker)}</div>
    <h1>${esc(opts.h1)}</h1>
    <p class="sub">${opts.lede}</p>
    ${opts.legend ? `<div class="legend"><span>What the labels mean:</span>${badge("published")} we have read the source and publish what it says ${badge("partial")} some read, more to come ${badge("none")} we have not read it yet &mdash; empty is not zero</div>` : ""}
  </div>
</section>
${opts.body}
</main>
<footer>
  <div class="wrap">
    <div class="foot-base">
      ${opts.footNote}
      <div class="foot-legal">&copy; 2026 Data Libertarian</div>
    </div>
  </div>
</footer>
<script src="/babuwatch/public-nav.js" defer></script>
</body>
</html>
`;
}

