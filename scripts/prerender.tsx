import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { PassThrough } from "node:stream";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import App from "../src/App";
import { metadataFor } from "../src/lib/metadata";

const origin = "https://datalibertarian.in";
const shell = await readFile("dist/index.html", "utf8");
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
async function render(path: string) {
  return new Promise<string>((resolve, reject) => {
    let output = "";
    const stream = new PassThrough();
    stream.on("data", (chunk) => { output += chunk; });
    stream.on("end", () => resolve(output));
    stream.on("error", reject);
    const renderer = renderToPipeableStream(<StaticRouter location={path}><App /></StaticRouter>, {
      onAllReady() { renderer.pipe(stream); }, onError(error) { reject(error); },
    });
  });
}
function page(path: string, body: string, notFound = false) {
  const m = metadataFor(path);
  return shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(notFound ? "Page not found — Data Libertarian" : m.title)}</title>`)
    .replace(/<meta\s+(?:name="description"|property="og:[^"]*")[\s\S]*?>/g, "")
    .replace("</head>", `<meta name="description" content="${escape(m.description)}"><link rel="canonical" href="${m.url}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:url" content="${m.url}"><meta property="og:type" content="website"><meta property="og:image" content="${m.image}"><meta name="twitter:card" content="summary_large_image">${notFound || path === "/search" ? '<meta name="robots" content="noindex">' : ''}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

// Discover real internal links from rendered pages. Only generated paths exist on the host;
// unknown URLs reach Vercel's static 404 instead of a catch-all 200 rewrite.
const pending = new Set(["/", "/compare", "/sources", "/corrections", "/inflation", "/search"]);
const visited = new Set<string>();
const rendered = new Set<string>();
for (const path of pending) {
  if (visited.size > 500) throw new Error("Unexpected route expansion");
  visited.add(path);
  const body = await render(path);
  if (body.includes("data-not-found")) continue;
  rendered.add(path);
  const file = `dist/${path === "/" ? "index" : path.slice(1)}.html`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, page(path, body));
  for (const match of body.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), origin + path);
    if (url.origin !== origin || /\.[a-z0-9]+$/i.test(url.pathname)) continue;
    const next = url.pathname.replace(/\/$/, "") || "/";
    if (!visited.has(next)) pending.add(next);
  }
}
await writeFile("dist/404.html", page("/404", await render("/404"), true));
const urls = [...rendered].filter(path => path !== "/search");
await writeFile("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>`);
await writeFile("dist/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Prerendered ${visited.size} routes, crawler files, and a static 404.`);
