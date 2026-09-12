import { titleFor } from "./nav";

export function metadataFor(pathname: string, search = "") {
  const title = titleFor(pathname, search);
  const descriptions: Record<string, string> = {
    "/": "Explore India's government budgets, compare state police spending, and follow inflation with sources for every figure.",
    "/states": "Explore state police budgets from official government books, with clear coverage and links to the original sources.",
    "/compare": "Compare government budgets by fiscal year and series. See the source figures and the books behind each median.",
    "/sources": "Read the official sources, extraction dates, accounting definitions, and limitations behind Data Libertarian.",
    "/corrections": "Report a correction with the official source, page, fiscal year, and figure. Learn how source changes are reviewed.",
    "/inflation": "Explore observed prices and inflation measures, with dates, units, and links to the published source documents.",
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
