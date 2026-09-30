import React from "react";
import type { ReactNode } from "react";
import { inr, one } from "./kit";
import { TILES } from "./tiles";

/** Palette: validated with the dataviz validator on #FFFFFF and #F7F5EF (CVD ΔE ≥ 16). */
export const BLUE = "#2A6FA8";
export const SAFFRON = "#B8651B";
export const GREY = "#8E96A1";
export const PALE = "#D9D5C8";
/** Third categorical hue; validated next to BLUE in the order plum, blue, saffron. */
export const PLUM = "#8A3B7A";
/** Fourth categorical hue; validated in the order saffron, blue, plum, green. */
export const GREEN = "#4E8F3A";
/** Sequential saffron ramp, light to dark, for magnitude on the tile map. */
export const SEQ = ["#F4E8D8", "#EACBA6", "#DCA56E", "#C27A36", "#8E4A12"];

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (step * mag >= v) return step * mag;
  return 10 * mag;
}

export function Figure({
  title,
  sub,
  legend,
  note,
  children,
  wide,
}: {
  title: string;
  sub?: ReactNode;
  legend?: { color: string; label: string }[];
  note?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className={`viz${wide ? " wide" : ""}`}>
      <figcaption>
        <h3>{title}</h3>
        {sub ? <p>{sub}</p> : null}
      </figcaption>
      {legend && legend.length > 1 ? (
        <ul className="viz-legend">
          {legend.map((l) => (
            <li key={l.label}>
              <span className="sw" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
      {note ? <p className="viz-note">{note}</p> : null}
    </figure>
  );
}

/** Top-rounded column path: 4px radius at the data end, square at the baseline. */
function colPath(x: number, y: number, w: number, h: number, round = true): string {
  const r = round ? Math.min(4, w / 2, h) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export type Seg = { key: string; value: number; color: string };

/** Vertical columns, single or stacked. One y-axis, clean ticks, value on the cap. */
export function Columns({
  rows,
  height = 250,
  fmt = inr,
  label,
  wide = false,
  marker,
}: {
  rows: { label: string; segs: Seg[]; tip: string; cap?: string }[];
  height?: number;
  fmt?: (n: number) => string;
  label: string;
  /** Full-width figure: draw on a wider canvas so text keeps its size. */
  wide?: boolean;
  /** A thin rule between two columns, e.g. where a definition changes. */
  marker?: { before: number; label: string };
}) {
  const W = wide ? 1000 : 500;
  const padL = wide ? 84 : 58;
  const padR = 12;
  const padT = 26;
  const padB = 30;
  const totals = rows.map((r) => r.segs.reduce((t, s) => t + s.value, 0));
  const max = niceMax(Math.max(...totals));
  const plotH = height - padT - padB;
  const band = (W - padL - padR) / rows.length;
  const bw = Math.min(wide ? 64 : 48, band * 0.5);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  // Pick the number of intervals that gives a round step (1, 2, 2.5 or 5 times a power of ten).
  const round = (v: number) => [1, 2, 2.5, 5, 10].includes(Number((v / 10 ** Math.floor(Math.log10(v))).toFixed(3)));
  const parts = [4, 5, 3, 6].find((k) => round(max / k)) ?? 4;
  const ticks = Array.from({ length: parts + 1 }, (_, i) => (i / parts) * max);
  return (
    <svg className="viz-svg" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className={t === 0 ? "axis" : "grid"} />
          <text x={padL - 8} y={y(t) + 4} className="tick" textAnchor="end">
            {fmt(t)}
          </text>
        </g>
      ))}
      {marker ? (
        <g className="marker">
          <line x1={padL + band * marker.before} x2={padL + band * marker.before} y1={padT - 16} y2={padT + plotH} />
          <text x={padL + band * marker.before + 6} y={padT - 6}>
            {marker.label}
          </text>
        </g>
      ) : null}
      {rows.map((row, i) => {
        const x = padL + band * i + (band - bw) / 2;
        let acc = 0;
        const total = totals[i]!;
        return (
          <g key={row.label} className="mark" tabIndex={0} data-tip={row.tip}>
            <rect x={padL + band * i} y={padT} width={band} height={plotH} className="hit" />
            {row.segs.map((s, j) => {
              const top = y(acc + s.value);
              const h = y(acc) - top - (j < row.segs.length - 1 ? 0 : 0);
              const gap = j > 0 ? 2 : 0;
              acc += s.value;
              return <path key={s.key} d={colPath(x, top, bw, Math.max(0, h - gap), j === row.segs.length - 1)} fill={s.color} />;
            })}
            <text x={x + bw / 2} y={y(total) - 8} className="cap" textAnchor="middle">
              {row.cap ?? fmt(total)}
            </text>
            <text x={x + bw / 2} y={height - 10} className="tick strong" textAnchor="middle">
              {row.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bars in HTML so long labels wrap. Stacked when a row has several segments. */
export function HBars({
  rows,
  max,
  label,
}: {
  rows: { label: string; sub?: string; segs: Seg[]; value: string; tip: string }[];
  max?: number;
  label: string;
}) {
  const top = max ?? Math.max(...rows.map((r) => r.segs.reduce((t, s) => t + s.value, 0)), 1);
  return (
    <ol className="hbars" aria-label={label}>
      {rows.map((row) => (
        <li key={row.label} className="mark" tabIndex={0} data-tip={row.tip}>
          <span className="hb-label">
            {row.label}
            {row.sub ? <small>{row.sub}</small> : null}
          </span>
          <span className="hb-track">
            {row.segs.map((s, j) => (
              <span
                key={s.key}
                className={`hb-seg${j === row.segs.length - 1 ? " end" : ""}`}
                style={{ width: `${(s.value / top) * 100}%`, background: s.color }}
              />
            ))}
          </span>
          <span className="hb-value">{row.value}</span>
        </li>
      ))}
    </ol>
  );
}

/** One 100% bar with a legend that carries the values. */
export function Parts({ parts, total, label }: { parts: { label: string; value: number; color: string; note?: string }[]; total: number; label: string }) {
  const sum = parts.reduce((t, p) => t + p.value, 0);
  if (sum !== total) throw new Error(`${label}: parts ${sum} != total ${total}`);
  return (
    <div className="parts">
      <div className="parts-bar" role="img" aria-label={label}>
        {parts.map((p, i) => (
          <span
            key={p.label}
            className={`mark${i === 0 ? " first" : ""}${i === parts.length - 1 ? " last" : ""}`}
            tabIndex={0}
            data-tip={`${p.label}: ${inr(p.value)} (${one((p.value / total) * 100)}%)`}
            style={{ flexGrow: p.value, background: p.color }}
          />
        ))}
      </div>
      <ul className="parts-key">
        {parts.map((p) => (
          <li key={p.label}>
            <span className="sw" style={{ background: p.color }} />
            <span className="pk-label">
              {p.label}
              {p.note ? <small>{p.note}</small> : null}
            </span>
            <span className="pk-value">
              {inr(p.value)} <em>{one((p.value / total) * 100)}%</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Break points that split the values into five groups of similar size, rounded for a legend. */
export function breaks(values: number[], digits = 1): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))]!;
  const f = 10 ** digits;
  const raw = [0.2, 0.4, 0.6, 0.8].map((p) => Math.round(q(p) * f) / f);
  return raw.filter((v, i) => i === 0 || v > raw[i - 1]!);
}

export function TileMap({
  values,
  fmt,
  unit,
  label,
  digits = 1,
}: {
  values: Record<string, { value: number | null; tip: string }>;
  fmt: (n: number) => string;
  unit: string;
  label: string;
  digits?: number;
}) {
  const nums = Object.values(values)
    .map((v) => v.value)
    .filter((v): v is number => v != null);
  const cuts = breaks(nums, digits);
  const bucket = (v: number) => cuts.filter((c) => v >= c).length;
  const S = 58;
  const G = 4;
  const cols = Math.max(...TILES.map((t) => t.col)) + 1;
  const rows = Math.max(...TILES.map((t) => t.row)) + 1;
  const W = cols * (S + G);
  const H = rows * (S + G);
  const legend = [0, ...cuts];
  return (
    <div className="tilemap">
      <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {TILES.map((t) => {
          const v = values[t.name];
          if (!v) throw new Error(`tile map: no value for ${t.name}`);
          const b = v.value == null ? -1 : bucket(v.value);
          const fill = b < 0 ? "#EEEBE1" : SEQ[b]!;
          const dark = b >= 3;
          const x = t.col * (S + G);
          const y = t.row * (S + G);
          return (
            <g key={t.name} className="mark tile" tabIndex={0} data-tip={v.tip}>
              <rect x={x} y={y} width={S} height={S} rx={4} fill={fill} />
              <text x={x + 7} y={y + 18} className={`t-code${dark ? " on-dark" : ""}`}>
                {t.code}
              </text>
              <text x={x + 7} y={y + S - 9} className={`t-val${dark ? " on-dark" : ""}`}>
                {v.value == null ? "—" : fmt(v.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="tile-legend">
        <span className="tl-unit">{unit}</span>
        <ol>
          {legend.map((lo, i) => (
            <li key={lo}>
              <span className="sw" style={{ background: SEQ[i] }} />
              {i === legend.length - 1 ? `${fmt(lo)}+` : `${fmt(lo)}–${fmt(legend[i + 1]!)}`}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Tabs that switch between panels. Without JavaScript every panel shows, one after the other. */
export function Tabs({ id, tabs }: { id: string; tabs: { label: string; body: ReactNode }[] }) {
  return (
    <div className="tabs" data-tabs={id}>
      <div className="tab-row" role="tablist">
        {tabs.map((t, i) => (
          <button key={t.label} type="button" role="tab" aria-selected={i === 0} data-tab={i}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} role="tabpanel" data-panel={i} className="tab-panel">
          {t.body}
        </div>
      ))}
    </div>
  );
}

export type Col<T> = { label: string; value: (row: T) => number | null; fmt?: (n: number) => string; note?: string };

/** Sortable, searchable table. Sorting is a progressive enhancement; the default order is the first column, high to low. */
export function DataTable<T extends { name: string }>({
  rows,
  cols,
  caption,
  search,
  keepOrder = false,
}: {
  rows: readonly T[];
  cols: Col<T>[];
  caption: string;
  search: string;
  /** Show rows in the order given (e.g. years) instead of by the first column. */
  keepOrder?: boolean;
}) {
  const first = cols[0]!;
  const sorted = keepOrder ? [...rows] : [...rows].sort((a, b) => (first.value(b) ?? -1) - (first.value(a) ?? -1));
  return (
    <div className="dt" data-table>
      <label className="dt-search">
        <span>{search}</span>
        <input type="search" placeholder="Type a name" data-filter />
      </label>
      <div className="dt-scroll">
        <table className="dtable">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              {cols.map((c, i) => (
                <th key={c.label} scope="col" className="n" aria-sort={i === 0 && !keepOrder ? "descending" : undefined}>
                  <button type="button" data-sort={i + 1}>
                    {c.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name} data-name={row.name.toLowerCase()}>
                <th scope="row">{row.name}</th>
                {cols.map((c) => {
                  const v = c.value(row);
                  return (
                    <td key={c.label} className="n" data-v={v ?? -1}>
                      {v == null ? "—" : (c.fmt ?? inr)(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type Part = { part: string; value: string; share: number | null; where: "inside" | "outside" | "survey"; note?: ReactNode };

const WHERE: Record<Part["where"], string> = {
  inside: "Inside the headline count",
  outside: "Outside it: a separate head",
  survey: "Survey only: never an FIR",
};

/** The parts of a crime, with every share of 10% or more marked. */
export function PartsTable({ rows, caption, shareOf }: { rows: Part[]; caption: string; shareOf: string }) {
  return (
    <div className="dt-scroll parts-table">
      <table className="dtable">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Part</th>
            <th scope="col" className="n">Figure</th>
            <th scope="col" className="n">{shareOf}</th>
            <th scope="col">Where it is counted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.part} className={r.share != null && r.share >= 10 ? "big" : undefined}>
              <th scope="row">
                {r.part}
                {r.note ? <small>{r.note}</small> : null}
              </th>
              <td className="n">{r.value}</td>
              <td className="n">{r.share == null ? "—" : `${one(r.share)}%`}</td>
              <td>
                <span className={`where ${r.where}`}>{WHERE[r.where]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Two government records of the same figure, side by side, with the gap. */
export function CheckTable({ rows, caption, left, right }: { rows: { label: string; a: number; b: number; note?: string }[]; caption: string; left: string; right: string }) {
  return (
    <div className="dt-scroll parts-table">
      <table className="dtable">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Figure</th>
            <th scope="col" className="n">{left}</th>
            <th scope="col" className="n">{right}</th>
            <th scope="col" className="n">Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">
                {r.label}
                {r.note ? <small>{r.note}</small> : null}
              </th>
              <td className="n">{inr(r.a)}</td>
              <td className="n">{inr(r.b)}</td>
              <td className="n">{r.a === r.b ? <span className="match">Same</span> : `${r.a > r.b ? "+" : "−"}${inr(Math.abs(r.a - r.b))}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A dated list of what official bodies decided. */
export function Record({ items }: { items: readonly { when: string; body: string; finding: string; cite: ReactNode }[] }) {
  return (
    <ol className="record">
      {items.map((x) => (
        <li key={x.when + x.body}>
          <span className="when">{x.when}</span>
          <span className="what">
            <strong>{x.body}.</strong> {x.finding}
            {x.cite}
          </span>
        </li>
      ))}
    </ol>
  );
}
