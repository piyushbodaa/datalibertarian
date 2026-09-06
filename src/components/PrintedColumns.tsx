import type { LineItem } from "../data/maharashtra-police";
import { pickAmount } from "../data/maharashtra-police";
import { BOOK_COLUMNS, SERIES_LABEL, formatCrore } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Props = {
  run: LineItem;
  cap: LineItem;
  caption?: string;
  title?: string;
  compact?: boolean;
  /** Horizontal bars only — no tall SVG. For the home poster. */
  barsOnly?: boolean;
};

const SERIES_HATCH: Record<string, { fill: string; hatch: string; stroke: string }> = {
  actual: { fill: "var(--rust)", hatch: "url(#hatch-rust)", stroke: "var(--rust)" },
  be: { fill: "var(--carbon)", hatch: "url(#hatch-carbon)", stroke: "var(--carbon)" },
  re: { fill: "var(--ochre)", hatch: "url(#hatch-ochre)", stroke: "var(--ochre)" },
};

export function PrintedColumns({
  run,
  cap,
  caption = "Spent, plan, updated plan, and next plan. Empty years stay empty.",
  title = "Last four official figures",
  compact = false,
  barsOnly = false,
}: Props) {
  const columns = BOOK_COLUMNS.map((col) => {
    const r = pickAmount(run, col.fiscalYear, col.series);
    const c = pickAmount(cap, col.fiscalYear, col.series);
    const total = (r?.crore ?? 0) + (c?.crore ?? 0);
    return {
      ...col,
      run: r,
      cap: c,
      total,
      citationId: r?.citationId ?? c?.citationId,
    };
  });

  const max = Math.max(...columns.map((c) => c.total), 1);
  const citationId = columns.find((c) => c.citationId)?.citationId;
  const ticks = yTicks(max);

  const vbW = 520;
  const vbH = 300;
  const plotLeft = 52;
  const plotRight = 508;
  const plotTop = 28;
  const plotBottom = 214;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;
  const barW = 84;
  const gap = (plotW - barW * columns.length) / (columns.length + 1);

  return (
    <figure className={compact ? "mt-4" : "mt-8"}>
      <ChartCaption title={title}>
        {caption}
        {citationId && !compact ? <CitationChip citationId={citationId} /> : null}
      </ChartCaption>

      <ol className={barsOnly ? "max-w-3xl space-y-3" : "max-w-3xl space-y-4 sm:hidden"}>
        {columns.map((col) => {
          const hatch =
            col.series === "actual" ? "hatch-rust" : col.series === "re" ? "hatch-ochre" : "hatch-carbon";
          const width = (col.total / max) * 100;
          return (
            <li key={`m-${col.fiscalYear}-${col.series}`}>
              <div className="text-sm">
                <span className="font-semibold">{SERIES_LABEL[col.series]}</span>{" "}
                <span className="text-ink/60">{col.fiscalYear}</span>
                <span className="num mt-0.5 block text-[0.8rem]">
                  {col.run && col.cap ? `₹${formatCrore(col.total)} crore` : "—"}
                </span>
              </div>
              <div
                className="mt-1.5 h-7 w-full bg-ink/[0.05]"
                role="img"
                aria-label={`${SERIES_LABEL[col.series]} ${col.fiscalYear}, ₹${formatCrore(col.total)} crore`}
              >
                <div className={`${hatch} h-7 border border-carbon/40`} style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ol>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className={barsOnly ? "hidden" : "hidden w-full max-w-3xl min-h-[300px] text-ink sm:block"}
        role="img"
        aria-labelledby="printed-cols-title printed-cols-desc"
      >
        <title id="printed-cols-title">Last four official figures</title>
        <defs>
          <pattern
            id="hatch-carbon"
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--carbon)" strokeWidth="2" />
          </pattern>
          <pattern
            id="hatch-ochre"
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--ochre)" strokeWidth="2" />
          </pattern>
          <pattern
            id="hatch-rust"
            patternUnits="userSpaceOnUse"
            width="5"
            height="5"
            patternTransform="rotate(90)"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--rust)" strokeWidth="1.8" />
          </pattern>
        </defs>
        <desc id="printed-cols-desc">
          {columns
            .map((col) => {
              if (!col.run || !col.cap) {
                return `${SERIES_LABEL[col.series]} ${col.fiscalYear}: not printed`;
              }
              return `${SERIES_LABEL[col.series]} ${col.fiscalYear}: ₹${formatCrore(col.total)} crore (running costs ₹${formatCrore(col.run.crore)} crore, capital ₹${formatCrore(col.cap.crore)} crore)`;
            })
            .join(". ")}
        </desc>

        {ticks.map((t) => {
          const y = plotBottom - (t / max) * plotH;
          return (
            <g key={t}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="var(--carbon)"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              <text
                x={plotLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fontFamily="IBM Plex Mono, ui-monospace, monospace"
                fill="var(--carbon)"
              >
                {t === 0 ? "0" : `${(t / 1000).toFixed(0)}k`}
              </text>
            </g>
          );
        })}
        <text
          x={plotLeft - 8}
          y={14}
          textAnchor="end"
          fontSize="9"
          fill="var(--carbon)"
          fontFamily="IBM Plex Sans, system-ui, sans-serif"
        >
          crore
        </text>

        {columns.map((col, i) => {
          const x = plotLeft + gap + i * (barW + gap);
          const h = (col.total / max) * plotH;
          const y = plotBottom - h;
          const missing = !col.run || !col.cap;
          const cx = x + barW / 2;
          const skin = SERIES_HATCH[col.series];

          return (
            <g key={`${col.fiscalYear}-${col.series}`}>
              {missing ? (
                <text
                  x={cx}
                  y={plotBottom - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--carbon)"
                >
                  —
                </text>
              ) : (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    fill={skin.fill}
                    fillOpacity={col.series === "actual" ? 0.5 : col.series === "re" ? 0.4 : 0.26}
                    stroke={skin.stroke}
                    strokeWidth="1.5"
                  />
                  <rect x={x} y={y} width={barW} height={h} fill={skin.hatch} />
                  <text
                    x={cx}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="IBM Plex Mono, ui-monospace, monospace"
                    fill="var(--ink)"
                  >
                    {Math.round(col.total).toLocaleString("en-IN")}
                  </text>
                </>
              )}
              <text
                x={cx}
                y={plotBottom + 18}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--ink)"
                fontFamily="IBM Plex Sans, system-ui, sans-serif"
              >
                {SERIES_LABEL[col.series]}
              </text>
              <text
                x={cx}
                y={plotBottom + 34}
                textAnchor="middle"
                fontSize="11"
                fill="var(--carbon)"
                fontFamily="IBM Plex Sans, system-ui, sans-serif"
              >
                {col.fiscalYear}
              </text>
            </g>
          );
        })}

        <line
          x1={plotLeft}
          x2={plotRight}
          y1={plotBottom}
          y2={plotBottom}
          stroke="var(--carbon)"
          strokeWidth="1.5"
        />

        <g
          transform="translate(52, 268)"
          fontSize="11"
          fontFamily="IBM Plex Sans, system-ui, sans-serif"
        >
          <rect width="12" height="12" fill="var(--rust)" fillOpacity="0.16" stroke="var(--rust)" />
          <rect width="12" height="12" fill="url(#hatch-rust)" />
          <text x="16" y="10" fill="var(--ink)">
            Spent
          </text>
          <rect
            x="148"
            width="12"
            height="12"
            fill="var(--carbon)"
            fillOpacity="0.16"
            stroke="var(--carbon)"
          />
          <rect x="148" width="12" height="12" fill="url(#hatch-carbon)" />
          <text x="164" y="10" fill="var(--ink)">
            Plan
          </text>
          <rect
            x="278"
            width="12"
            height="12"
            fill="var(--ochre)"
            fillOpacity="0.16"
            stroke="var(--ochre)"
          />
          <rect x="278" width="12" height="12" fill="url(#hatch-ochre)" />
          <text x="294" y="10" fill="var(--ink)">
            Updated plan
          </text>
        </g>
      </svg>
      {compact ? null : (
        <p className="mt-1 max-w-3xl text-[0.7rem] text-ink/55">
          Axis in crore of rupees. Spent, plan, and updated plan are different kinds of figure — not
          one trend. Totals on the bars are rounded for the eye.
        </p>
      )}
    </figure>
  );
}

function yTicks(max: number): number[] {
  const step = max > 80_000 ? 50_000 : 10_000;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const last = ticks[ticks.length - 1] ?? 0;
  if (last < max) ticks.push(last + step);
  return ticks;
}
