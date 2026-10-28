// Must be the final build step: independent generators replace entire HTML pages.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const TAG = '<!-- privacy-safe-analytics --><link rel="stylesheet" href="/analytics.css"><script defer src="/analytics.js"></script>';
export async function injectAnalytics(root) {
  let count = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = await readFile(file, 'utf8');
        if (html.includes('<!-- privacy-safe-analytics -->')) continue;
        if (!/<\/head>/i.test(html)) throw new Error('HTML missing </head>: ' + file);
        await writeFile(file, html.replace(/<\/head>/i, TAG + '\n</head>'));
        count += 1;
      }
    }
  }
  await visit(root);
  return count;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('Analytics added to ' + await injectAnalytics(resolve(process.argv[2] || 'dist')) + ' final HTML pages');
}
