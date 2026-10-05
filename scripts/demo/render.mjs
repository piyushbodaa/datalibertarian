// Renders scripts/demo/composition.html to video, one frame at a time.
// Usage: node scripts/demo/render.mjs [wide|square|all] [--fps 30] [--preview 12.5]
//   wide   1920x1080 -> shots/demo/datalibertarian-wide.mp4, plus a 720p copy for the
//          homepage at public/demo/tour.mp4 and its poster tour.jpg
//   square 1080x1080 -> shots/demo/datalibertarian-x.mp4 (for posting on X)
// Needs shots/demo/*.png from capture.mjs, and ffmpeg and python3 on PATH.
import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const which = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const fps = Number(opt('--fps', 30));
const preview = opt('--preview');                     // render one still at this time, for checking
const FORMATS = {
  wide: { w: 1920, h: 1080, out: 'shots/demo/datalibertarian-wide.mp4', web: 'public/demo/tour.mp4', poster: 'public/demo/tour.jpg' },
  square: { w: 1080, h: 1080, out: 'shots/demo/datalibertarian-x.mp4' },
};

const shotDir = path.resolve('shots/demo');
const shots = JSON.parse(fs.readFileSync(path.join(shotDir, 'shots.json'), 'utf8'));
const comp = pathToFileURL(path.resolve('scripts/demo/composition.html')).href;
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });

for (const [name, f] of Object.entries(FORMATS)) {
  if (which !== 'all' && which !== name) continue;
  const page = await browser.newPage({ viewport: { width: f.w, height: f.h } });
  await page.addInitScript(([s, d, sq]) => {
    window.SHOTS = s; window.SHOT_DIR = d;
    if (sq) document.addEventListener('DOMContentLoaded', () => document.body.classList.add('sq'));
  }, [shots, pathToFileURL(shotDir).href + '/', name === 'square']);
  await page.goto(comp, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });

  if (preview) {
    await page.evaluate(t => window.render(t), Number(preview));
    const p = `shots/demo/preview-${name}-${preview}.png`;
    await page.screenshot({ path: p });
    console.log('wrote', p);
    continue;
  }

  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.round(duration * fps);
  fs.mkdirSync(path.dirname(f.out), { recursive: true });

  // sound, from the cue list the composition publishes
  const wav = `shots/demo/sound-${name}.wav`;
  fs.writeFileSync('shots/demo/cues.json', JSON.stringify({ duration, cues: await page.evaluate(() => window.CUES) }));
  execFileSync('python3', ['scripts/demo/sound.py', 'shots/demo/cues.json', wav], { stdio: 'inherit' });

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-i', wav, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', f.out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 5) === 0) process.stdout.write(`\r${name}: ${Math.round(100 * i / frames)}%  `);
  }
  ff.stdin.end();
  await done;
  console.log(`\r${name}: ${f.out} (${(fs.statSync(f.out).size / 1e6).toFixed(1)} MB, ${duration}s)`);
  if (f.web) {
    fs.mkdirSync(path.dirname(f.web), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f.out, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow',
      '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', f.web]);
    console.log(`${name}: ${f.web} (${(fs.statSync(f.web).size / 1e6).toFixed(1)} MB)`);
  }
  if (f.poster) {
    await page.evaluate(t => window.render(t), 15.2);            // the title card
    await page.screenshot({ path: f.poster, type: 'jpeg', quality: 88 });
  }
  await page.close();
}
await browser.close();
