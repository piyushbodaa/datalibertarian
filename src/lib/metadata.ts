import { titleFor } from "./nav";

export function metadataFor(pathname: string, search = "") {
  const title = titleFor(pathname, search);
  const descriptions: Record<string, string> = {
    "/": "Explore India's government budgets, compare state police spending, and follow inflation with sources for every figure.",
    "/spending": "Explore India's government budgets, compare state police spending, and follow inflation with sources for every figure.",
    "/states": "Explore state police budgets from official government books, with clear coverage and links to the original sources.",
    "/compare": "Compare government budgets by fiscal year and series. See the source figures and the books behind each median.",
    "/sources": "Read the official sources, extraction dates, accounting definitions, and limitations behind Data Libertarian.",
    "/source": "A directory of Indian government websites that publish all-India data, by subject: the organisation, the exact link to each dataset, and what the data holds.",
    "/corrections": "Report a correction with the official source, page, fiscal year, and figure. Learn how source changes are reviewed.",
    "/pressreleases": "Pilot index of the top 100 police departments with official press-release archives, latest verified releases, and direct links to PDFs and HTML notes.",
    "/pressreleases/police": "Pilot index of the top 100 police departments with official press-release archives, latest verified releases, and direct links to PDFs and HTML notes.",
    "/pressreleases/police/ap": "Andhra Pradesh police press releases: 26-district state index with Telugu-translated summaries and direct links to official district archives.",
    "/inflation": "Compare all 358 items in India’s CPI with independently sourced retail and service prices. Exact official weights, rural and urban indices, evidence gaps, and open data.",
  };
  return { title, description: descriptions[pathname] ?? `${title.replace(" — Data Libertarian", "")}: explore figures, accounting scope, and original sources.`, url: `https://datalibertarian.in${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`, image: "https://datalibertarian.in/social-preview.png" };
}

export function applyMetadata(pathname: string, search = "") {
  const meta = metadataFor(pathname, search);
  document.title = meta.title;
  const values = { description: meta.description, "og:title": meta.title, "og:description": meta.description, "og:url": meta.url, "og:image": meta.image, "twitter:card": "summary_large_image" };
  for (const [key, value] of Object.entries(values)) {
    const attr = key.startsWith("og:") ? "property" : "name";
    let node = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!node) { node = document.createElement("meta"); node.setAttribute(attr, key); document.head.append(node); }
    node.content = value;
  }
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
  canonical.href = meta.url;
}
