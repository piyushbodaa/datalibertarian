export const REDTAPE_CSS = `/* Red Tape (/redtape) — editorial layout native to the Data Libertarian home page.
   Tokens come from /site-nav.css. No boxes inside boxes, no uppercase labels,
   no monospace figures; colour is reserved for the two clock owners. */

:root {
  --rt-ink: var(--dl-ink, #16181D);
  --rt-ink-2: var(--dl-ink-2, #4A4F59);
  --rt-muted: var(--dl-muted, #6B7079);
  --rt-line: var(--dl-line, #E6E6E3);
  --rt-line-2: var(--dl-line-strong, #D3D3CF);
  --rt-accent: var(--dl-accent, #1F4FD1);
  --rt-accent-soft: var(--dl-accent-soft, #EEF2FC);
  --rt-tint: var(--dl-tint, #F7F7F5);
  --rt-gov: #A13A2F;
  --rt-app: #7A5A1E;
  --rt-int: #9CA3AF;
  --rt-sans: var(--dl-sans, 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
  --rt-mono: var(--dl-mono, ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace);
  --rt-wrap: var(--dl-wrap, 1168px);
  --rt-gutter: var(--dl-gutter, 24px);
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #fff; color: var(--rt-ink); font: 16px/1.6 var(--rt-sans); -webkit-font-smoothing: antialiased; }
main a { color: var(--rt-accent); text-decoration: none; }
main a:hover { text-decoration: underline; }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible { outline: 2px solid var(--rt-accent); outline-offset: 2px; }
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 16px; top: 16px; background: #fff; padding: 8px 12px; z-index: 1000; }
.rt-wrap { max-width: var(--rt-wrap); margin: 0 auto; padding: 0 var(--rt-gutter); }
.rt-num { font-variant-numeric: tabular-nums; }
.rt-code { font-family: var(--rt-mono); font-size: 0.9em; overflow-wrap: anywhere; }
.rt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.rt-empty { margin: 0; padding: 16px 0; color: var(--rt-muted); font-size: 15px; list-style: none; }

/* ---------- Hero ---------- */
.rt-hero { padding: 72px 0 56px; }
.rt-hero h1 { font-size: 40px; line-height: 1.15; letter-spacing: -0.02em; font-weight: 700; margin: 0 0 16px; max-width: 22ch; }
.rt-hero-sub { font-size: 18px; color: var(--rt-ink-2); max-width: 60ch; margin: 0 0 28px; }
.rt-search { display: flex; gap: 8px; max-width: 600px; }
.rt-search input { flex: 1; min-width: 0; height: 48px; padding: 0 14px; font: inherit; border: 1px solid var(--rt-line-2); border-radius: 8px; background: #fff; color: var(--rt-ink); }
.rt-search button { height: 48px; padding: 0 22px; font: inherit; font-weight: 600; color: #fff; background: var(--rt-accent); border: 0; border-radius: 8px; cursor: pointer; }
.rt-hint { margin: 12px 0 0; font-size: 14px; color: var(--rt-muted); max-width: 70ch; }
.rt-hint a { color: var(--rt-ink-2); text-decoration: underline; text-decoration-color: var(--rt-line-2); text-underline-offset: 3px; }

.rt-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px; margin-top: 56px; padding-top: 32px; border-top: 1px solid var(--rt-line); }
.rt-stat { display: block; color: inherit; min-width: 0; }
.rt-stat:hover { text-decoration: none; }
.rt-stat-k { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: var(--rt-ink); }
.rt-stat b { display: block; font-size: 32px; line-height: 1.15; font-weight: 650; letter-spacing: -0.015em; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--rt-ink); }
.rt-stat b small { font-size: 17px; font-weight: 500; color: var(--rt-ink-2); letter-spacing: 0; }
.rt-stat p { margin: 8px 0 0; font-size: 15px; color: var(--rt-ink-2); }
.rt-stat .rt-stat-n { margin-top: 6px; font-size: 13.5px; color: var(--rt-muted); }

/* ---------- Sections ---------- */
.rt-sec { padding: 64px 0; border-top: 1px solid var(--rt-line); }
.rt-sec-tint { background: var(--rt-tint); }
.rt-sec h2 { font-size: 26px; line-height: 1.25; letter-spacing: -0.015em; font-weight: 650; margin: 0 0 8px; max-width: 30ch; }
.rt-lead { color: var(--rt-ink-2); margin: 0 0 28px; max-width: 64ch; font-size: 16.5px; }
.rt-sub { padding-top: 40px; margin-top: 40px; border-top: 1px solid var(--rt-line); }
.rt-sub h3 { font-size: 19px; line-height: 1.3; font-weight: 650; margin: 0 0 6px; letter-spacing: -0.01em; }
.rt-sub > p { margin: 0 0 20px; color: var(--rt-ink-2); max-width: 64ch; }
.rt-caption { margin: 14px 0 0; font-size: 13.5px; color: var(--rt-muted); max-width: 72ch; }

/* ---------- Legend & segmented controls ---------- */
.rt-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; margin: 0 0 24px; }
.rt-toolbar > * { min-width: 0; max-width: 100%; }
.rt-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; color: var(--rt-ink-2); }
.rt-legend span { display: inline-flex; align-items: center; gap: 7px; }
.rt-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; vertical-align: 1px; flex-shrink: 0; font-style: normal; }
.rt-legend .rt-dot { margin-right: 0; }
.rt-dot-gov { background: var(--rt-gov); }
.rt-dot-app { background: var(--rt-app); }
.rt-dot-int { background: var(--rt-int); }
.rt-seg-group { display: inline-flex; flex-wrap: wrap; padding: 3px; border-radius: 8px; background: #F1F1EE; gap: 2px; max-width: 100%; }
.rt-sec-tint .rt-seg-group { background: #E9E9E5; }
.rt-seg-group button { border: 0; background: transparent; font: inherit; font-size: 14px; font-weight: 500; color: var(--rt-ink-2); padding: 6px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.rt-seg-group button[aria-pressed="true"] { background: #fff; color: var(--rt-ink); box-shadow: 0 1px 2px rgba(22, 24, 29, 0.08); }
.rt-controls-row { display: flex; flex-wrap: wrap; gap: 10px; max-width: 100%; }

/* ---------- Horizontal bar charts ---------- */
.rt-bars { display: flex; flex-direction: column; }
.rt-bar-row { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; align-items: start; padding: 15px 0; border-top: 1px solid var(--rt-line); }
.rt-bar-row:first-child { border-top: 0; }
.rt-bar-label b { display: block; font-size: 15.5px; font-weight: 600; line-height: 1.35; color: var(--rt-ink); }
.rt-bar-label span { display: block; font-size: 13.5px; color: var(--rt-muted); line-height: 1.4; margin-top: 2px; }
.rt-bar-track { min-width: 0; }
.rt-bar-canvas { position: relative; margin-right: 102px; min-height: 22px; }
.rt-bar { display: flex; height: 22px; border-radius: 3px; overflow: hidden; gap: 1px; min-width: 3px; }
.rt-seg { display: block; height: 100%; }
.rt-seg-gov { background: var(--rt-gov); }
.rt-seg-app { background: var(--rt-app); }
.rt-seg-int { background: var(--rt-int); }
.rt-bar-val { position: absolute; top: 0; line-height: 22px; padding-left: 10px; font-size: 15px; font-weight: 600; white-space: nowrap; color: var(--rt-ink); }
.rt-bar-split { display: block; margin-top: 6px; font-size: 13px; color: var(--rt-muted); font-variant-numeric: tabular-nums; }
.rt-bar-split .rt-dot { width: 7px; height: 7px; margin-right: 4px; }
.rt-mark { position: absolute; top: -4px; height: 30px; border-left: 1.5px dashed var(--rt-ink); opacity: 0.5; pointer-events: none; }
.rt-mark span { position: absolute; top: -17px; left: 4px; font-size: 11.5px; white-space: nowrap; color: var(--rt-ink-2); opacity: 0; transition: opacity .12s; }
.rt-bar-row:hover .rt-mark span, .rt-bar-row:first-child .rt-mark span { opacity: 1; }
.rt-bar-axisrow { padding-top: 6px; border-top: 0; }
.rt-bar-axis { position: relative; height: 18px; margin-right: 102px; border-top: 1px solid var(--rt-line-2); }
.rt-bar-axis span { position: absolute; top: 4px; transform: translateX(-50%); font-size: 12px; color: var(--rt-muted); font-variant-numeric: tabular-nums; }
.rt-bar-axis span:first-child { transform: none; }
.rt-bar-axis span:last-child { transform: translateX(-100%); }

/* ---------- Hairline tables ---------- */
.rt-more-table { margin-top: 24px; overflow-x: auto; }
.rt-more-table > summary, .rt-leg-more > summary { cursor: pointer; color: var(--rt-accent); font-size: 14.5px; font-weight: 500; list-style: none; }
.rt-more-table > summary::-webkit-details-marker, .rt-leg-more > summary::-webkit-details-marker { display: none; }
.rt-more-table > summary::after { content: " ↓"; }
.rt-more-table[open] > summary::after { content: " ↑"; }
.rt-table { width: 100%; border-collapse: collapse; font-size: 15px; font-variant-numeric: tabular-nums; margin-top: 14px; }
.rt-table th, .rt-table td { padding: 11px 12px 11px 0; text-align: right; border-bottom: 1px solid var(--rt-line); vertical-align: middle; }
.rt-table th:first-child, .rt-table td:first-child { text-align: left; }
.rt-table th:last-child, .rt-table td:last-child { padding-right: 0; }
.rt-table thead th { font-size: 13.5px; font-weight: 500; color: var(--rt-muted); border-bottom-color: var(--rt-line-2); white-space: nowrap; }
.rt-table td.rt-l, .rt-table th.rt-l { text-align: left; }
.rt-table th button { all: unset; cursor: pointer; }
.rt-table th button:hover { color: var(--rt-ink); }
.rt-table th button:focus-visible { outline: 2px solid var(--rt-accent); outline-offset: 2px; }
.rt-table th[aria-sort="ascending"] button::after { content: " ↑"; color: var(--rt-accent); }
.rt-table th[aria-sort="descending"] button::after { content: " ↓"; color: var(--rt-accent); }
.rt-table .rt-muted { color: var(--rt-muted); }
.rt-table td small { display: block; font-size: 13px; color: var(--rt-muted); }

/* ---------- Trace an application ---------- */
.rt-finder { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.rt-finder-top { display: flex; gap: 10px; flex-wrap: wrap; }
.rt-finder-top input, .rt-finder-top select { height: 44px; padding: 0 12px; font: inherit; font-size: 15px; border: 1px solid var(--rt-line-2); border-radius: 8px; background: #fff; color: var(--rt-ink); min-width: 0; }
.rt-finder-top input { flex: 1 1 320px; }
.rt-finder-top select { flex: 0 1 220px; }
.rt-stories { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 14px; color: var(--rt-muted); }
.rt-chip { border: 1px solid var(--rt-line-2); background: #fff; color: var(--rt-ink-2); font: inherit; font-size: 14px; padding: 6px 12px; border-radius: 999px; cursor: pointer; }
.rt-chip:hover { border-color: var(--rt-ink-2); color: var(--rt-ink); }
.rt-chip[aria-pressed="true"] { border-color: var(--rt-accent); background: var(--rt-accent-soft); color: var(--rt-accent); }
.rt-linkbtn { border: 0; background: none; font: inherit; font-size: 14px; color: var(--rt-accent); cursor: pointer; padding: 6px 4px; }

.rt-trace-grid { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 40px; align-items: start; }
.rt-list-col { min-width: 0; }
.rt-list-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; color: var(--rt-muted); padding-bottom: 8px; border-bottom: 1px solid var(--rt-line-2); }
.rt-list { list-style: none; margin: 0; padding: 0; max-height: 760px; overflow-y: auto; }
.rt-item { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--rt-line); background: transparent; padding: 12px 10px 12px 12px; font: inherit; color: inherit; cursor: pointer; border-left: 2px solid transparent; }
.rt-item:hover { background: rgba(255, 255, 255, 0.7); }
.rt-item.is-active { background: #fff; border-left-color: var(--rt-accent); }
.rt-item-name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 14.5px; font-weight: 600; line-height: 1.4; color: var(--rt-ink); }
.rt-item-meta { display: block; margin-top: 3px; font-size: 13px; color: var(--rt-muted); }
.rt-item-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 13px; color: var(--rt-ink-2); white-space: nowrap; }
.rt-mini { display: flex; flex: 1; height: 6px; border-radius: 3px; overflow: hidden; gap: 1px; background: var(--rt-line); }
.rt-more { margin-top: 12px; }

.rt-detail { background: #fff; border-radius: 10px; padding: 32px 36px; min-width: 0; }
.rt-tr-kicker { margin: 0 0 6px; font-size: 14px; color: var(--rt-muted); }
.rt-tr-title { margin: 0 0 6px; font-size: 22px; line-height: 1.3; font-weight: 650; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.rt-tr-sub { margin: 0; font-size: 15px; color: var(--rt-ink-2); }
.rt-tr-nums { display: flex; flex-wrap: wrap; gap: 16px 40px; margin: 24px 0 18px; }
.rt-tr-nums div { min-width: 0; }
.rt-tr-nums b { display: block; font-size: 24px; line-height: 1.2; font-weight: 650; letter-spacing: -0.01em; white-space: nowrap; }
.rt-tr-nums span { font-size: 14px; color: var(--rt-muted); }
.rt-strip { display: flex; height: 14px; border-radius: 3px; overflow: hidden; gap: 1px; background: var(--rt-line); }
.rt-strip-axis { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; font-size: 13px; color: var(--rt-muted); }
.rt-tr-clock { margin: 20px 0 0; padding: 0 0 0 14px; border-left: 2px solid var(--rt-gov); font-size: 15px; color: var(--rt-ink-2); max-width: 68ch; }
.rt-tr-clock b { color: var(--rt-ink); font-weight: 600; }

.rt-legs { list-style: none; margin: 32px 0 0; padding: 0; position: relative; }
.rt-legs::before { content: ""; position: absolute; top: 6px; bottom: 6px; left: 50%; width: 2px; margin-left: -1px; background: var(--rt-line); }
.rt-leg { position: relative; width: 50%; padding: 4px 32px 18px; }
.rt-leg p { margin: 0; }
.rt-leg::before { content: ""; position: absolute; top: 9px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--rt-line-2); }
.rt-leg-gov { margin-right: 50%; text-align: right; }
.rt-leg-gov::before { right: -6px; background: var(--rt-gov); }
.rt-leg-app, .rt-leg-int { margin-left: 50%; }
.rt-leg-app::before { left: -6px; background: var(--rt-app); }
.rt-leg-int::before { left: -6px; background: var(--rt-int); }
.rt-leg-who { font-size: 13px; font-weight: 600; }
.rt-leg-gov .rt-leg-who { color: var(--rt-gov); }
.rt-leg-app .rt-leg-who { color: var(--rt-app); }
.rt-leg-int .rt-leg-who { color: var(--rt-ink-2); }
.rt-leg-days { font-size: 19px; font-weight: 650; line-height: 1.3; letter-spacing: -0.01em; }
.rt-leg-what { font-size: 15px; color: var(--rt-ink); line-height: 1.45; }
.rt-leg-out { font-size: 14px; color: var(--rt-ink-2); }
.rt-leg-when { font-size: 13px; color: var(--rt-muted); margin-top: 2px !important; }
.rt-leg-more { margin-top: 6px; font-size: 13.5px; }
.rt-leg-more > summary { font-size: 13.5px; }
.rt-leg-more ul { list-style: none; margin: 8px 0 0; padding: 0; }
.rt-leg-more li { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-top: 1px solid var(--rt-line); color: var(--rt-ink-2); text-align: left; }
.rt-leg-gov .rt-leg-more li { flex-direction: row-reverse; }
.rt-leg-end { width: auto; margin: 0; padding: 14px 0 0; text-align: center; }
.rt-leg-end::before { left: 50%; margin-left: -6px; top: 0; background: var(--rt-ink); }
.rt-leg-end .rt-leg-what { display: inline-block; margin-top: 10px; background: #fff; padding: 0 10px; font-weight: 600; position: relative; }
.rt-src { margin: 28px 0 0; padding-top: 14px; border-top: 1px solid var(--rt-line); font-size: 13px; color: var(--rt-muted); }

/* ---------- Clock dumbbells ---------- */
.rt-db { display: flex; flex-direction: column; }
.rt-db-row { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; align-items: center; padding: 14px 0; border-top: 1px solid var(--rt-line); }
.rt-db-row:first-child { border-top: 0; }
.rt-db-row .rt-bar-label button { all: unset; cursor: pointer; display: block; }
.rt-db-row .rt-bar-label button:hover b { color: var(--rt-accent); text-decoration: underline; }
.rt-db-canvas { position: relative; height: 24px; margin-right: 228px; }
.rt-db-line { position: absolute; top: 10px; height: 3px; background: var(--rt-gov); opacity: 0.35; border-radius: 2px; }
.rt-db-dot { position: absolute; top: 5px; width: 13px; height: 13px; margin-left: -6.5px; border-radius: 50%; }
.rt-db-off { background: #fff; border: 2px solid var(--rt-ink-2); }
.rt-db-true { background: var(--rt-gov); }
.rt-db-val { position: absolute; top: 2px; padding-left: 12px; font-size: 13.5px; white-space: nowrap; color: var(--rt-ink); font-variant-numeric: tabular-nums; }
.rt-db-val b { color: var(--rt-gov); font-weight: 600; }
.rt-db-val span { color: var(--rt-muted); }

/* ---------- Forest loop chain ---------- */
.rt-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 4px; margin: 4px 0 18px; font-size: 14.5px; }
.rt-chain span { padding: 5px 11px; border: 1px solid var(--rt-line-2); border-radius: 999px; background: #fff; white-space: nowrap; }
.rt-chain i { font-style: normal; color: var(--rt-muted); padding: 0 2px; }

/* ---------- Two-up blocks & journey ---------- */
.rt-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48px; }
.rt-journey-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; color: var(--rt-ink-2); margin-bottom: 18px; }
.rt-journey-legend span { display: inline-flex; align-items: center; gap: 7px; }
.rt-sw { display: inline-block; width: 12px; height: 12px; border-radius: 2px; }
.rt-ph-tor { background: #C98A82; }
.rt-ph-eia { background: #D9CDB4; }
.rt-ph-redo { background: #B9BEC6; }
.rt-ph-ec { background: var(--rt-gov); }
.rt-ph-app { background: var(--rt-app); }
.rt-trend { width: 100%; height: auto; display: block; }
.rt-trend text { font-family: var(--rt-sans); }

/* ---------- Open data band ---------- */
.rt-data { padding: 40px 0 64px; border-top: 1px solid var(--rt-line); font-size: 15px; color: var(--rt-ink-2); }
.rt-data p { margin: 0 0 6px; }
.rt-data a { white-space: nowrap; }

/* ---------- Methodology prose ---------- */
.rt-prose { max-width: 68ch; font-size: 16.5px; line-height: 1.7; color: var(--rt-ink-2); }
.rt-prose h2 { font-size: 22px; font-weight: 650; color: var(--rt-ink); margin: 48px 0 10px; letter-spacing: -0.01em; }
.rt-prose h2:first-child { margin-top: 0; }
.rt-prose p, .rt-prose ul { margin: 0 0 16px; }
.rt-prose li { margin-bottom: 8px; }
.rt-prose b, .rt-prose strong { color: var(--rt-ink); font-weight: 600; }
.rt-prose code { font-family: var(--rt-mono); font-size: 0.88em; background: var(--rt-tint); padding: 1px 5px; border-radius: 4px; }

@media (max-width: 1024px) {
  .rt-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rt-trace-grid { grid-template-columns: 1fr; gap: 28px; }
  .rt-list { max-height: 420px; }
  .rt-two { grid-template-columns: 1fr; gap: 40px; }
}
@media (max-width: 720px) {
  .rt-hero { padding: 40px 0; }
  .rt-hero h1 { font-size: 30px; }
  .rt-hero-sub { font-size: 17px; }
  .rt-search { flex-direction: column; }
  .rt-search input, .rt-search button { flex: none; width: 100%; }
  .rt-stats { grid-template-columns: 1fr 1fr; gap: 28px 20px; margin-top: 40px; }
  .rt-stat b { font-size: 26px; }
  .rt-sec { padding: 44px 0; }
  .rt-sec h2 { font-size: 22px; }
  .rt-bar-row, .rt-db-row { grid-template-columns: 1fr; gap: 8px; }
  .rt-bar-row.has-mark:first-child .rt-bar-track { margin-top: 18px; }
  .rt-bar-row:not(:first-child) .rt-mark span { display: none; }
  .rt-bar-axisrow .rt-bar-label { display: none; }
  .rt-bar-canvas { margin-right: 88px; }
  .rt-bar-axis { margin-right: 88px; }
  .rt-db-canvas { height: auto; margin-right: 8px; padding-top: 22px; }
  .rt-db-val { position: static; display: block; padding-left: 0; white-space: normal; }
  .rt-detail { padding: 22px 18px; border-radius: 8px; }
  .rt-tr-nums { gap: 12px 24px; }
  .rt-tr-nums b { font-size: 20px; }
  .rt-legs::before { left: 6px; }
  .rt-leg, .rt-leg-gov, .rt-leg-app, .rt-leg-int { width: auto; margin: 0; padding: 2px 0 16px 28px; text-align: left; }
  .rt-leg-gov::before, .rt-leg-app::before, .rt-leg-int::before { left: 0; right: auto; }
  .rt-leg-gov .rt-leg-more li { flex-direction: row; }
  .rt-leg-end { padding-left: 28px; text-align: left; }
  .rt-leg-end::before { left: 0; margin-left: 0; top: 14px; }
  .rt-leg-end .rt-leg-what { margin-top: 0; padding: 0; }
  .rt-finder-top select { flex: 1 1 100%; }
  .rt-table { font-size: 13.5px; }
  .rt-table th, .rt-table td { padding: 10px 8px 10px 0; }
  .rt-table th:last-child, .rt-table td:last-child { padding-right: 0; }
  .rt-table thead th { font-size: 12.5px; white-space: normal; }
  .rt-hide-sm { display: none; }
}
@media (max-width: 420px) {
  .rt-stats { grid-template-columns: 1fr; }
}
`;
