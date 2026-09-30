// Writes the site-wide bar (src/lib/siteNav.ts) into every built HTML page.
// Runs last in `npm run build`, after every section has written its pages.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { injectSiteNav } from "../src/lib/siteNav";

const root = process.argv[2] ?? "dist";

async function* htmlFiles(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

/** dist/crime/rape/index.html -> /crime/rape; dist/snapshot.html -> / */
function urlPath(file: string): string {
  let p = "/" + relative(root, file).split(sep).join("/");
  p = p.replace(/\.html$/, "").replace(/\/index$/, "") || "/";
  return p === "/snapshot" || p === "/404" ? "/" : p;
}

let changed = 0;
let skipped = 0;
for await (const file of htmlFiles(root)) {
  const html = await readFile(file, "utf8");
  const out = injectSiteNav(html, urlPath(file));
  if (out === html) { skipped++; continue; }
  await writeFile(file, out);
  changed++;
}
console.log(`site-nav: added the site bar to ${changed} pages (${skipped} already had it or are fragments)`);
