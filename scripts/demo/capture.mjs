// Screenshots of the built site for the demo video's montage.
// Writes shots/demo/<name>.png and shots/demo/shots.json (where each pan starts and ends).
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const base = process.env.DEMO_BASE || 'http://127.0.0.1:4173';
const out = 'shots/demo';
fs.mkdirSync(out, { recursive: true });

// from/to: where the pan starts and ends (top of frame), as a selector or a page offset.
const shots = [
  { name: 'search', url: '/search?q=Maharashtra%20police', from: 'h1', to: 'h1', wait: 1500 },
  { name: 'tracker', url: '/babuwatch/tracker', from: 'h1', to: 380 },
  { name: 'rape', url: '/crime/rape', from: 'h1', to: 780 },
  { name: 'state', url: '/maharashtra', from: 'h1', to: 620 },
  { name: 'spending', url: '/spending', from: 'h1', to: 420 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const meta = {};
for (const s of shots) {
  await page.goto(base + s.url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (s.wait) await page.waitForTimeout(s.wait);
  // Drop floating buttons; they would sit on top of the pan.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *'))
      if (getComputedStyle(el).position === 'fixed') el.style.display = 'none';
  });
  const top = sel => typeof sel === 'number' ? sel : page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 120) : 0;
  }, sel);
  const from = await top(s.from), to = await top(s.to);
  const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), to + 1400);
  await page.screenshot({ path: `${out}/${s.name}.png`, clip: { x: 0, y: 0, width: 1440, height }, fullPage: true });
  meta[s.name] = { url: s.url, from, to, height };
  console.log(s.name, meta[s.name]);
}
fs.writeFileSync(`${out}/shots.json`, JSON.stringify(meta, null, 2));
await browser.close();
