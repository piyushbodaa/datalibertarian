import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";
import { CPI_DIVISIONS, WEIGHTS_CITE } from "../data/inflation/weights";
import { formatPct } from "../data/inflation/yoy";

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function donutSlice(start: number, end: number, rOut = 42, rIn = 22, cx = 50, cy = 50): string {
  const sweep = Math.max(end - start, 0.35);
  const large = sweep > 180 ? 1 : 0;
  const [x1, y1] = polar(cx, cy, rOut, start);
  const [x2, y2] = polar(cx, cy, rOut, start + sweep);
  const [x3, y3] = polar(cx, cy, rIn, start + sweep);
  const [x4, y4] = polar(cx, cy, rIn, start);
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} L ${x3.toFixed(3)} ${y3.toFixed(3)} A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(3)} ${y4.toFixed(3)} Z`;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-[2px] border border-ink/40"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function BasketPie() {
  const nav = useNavigate();
  const [active, setActive] = useState("food");
  let cursor = 0;
  const slices = CPI_DIVISIONS.map((d) => {
    const start = cursor;
    cursor += (d.weight / 100) * 360;
    return { ...d, start, end: cursor, mid: (start + cursor) / 2 };
  });
  const current = slices.find((s) => s.id === active) ?? slices[0];

  return (
    <figure className="mt-10">
      <ChartCaption title="The basket they use">
        Combined CPI 2024 weights. Each colour is one division. The square in front of the name is
        the same colour as that wedge. Hover a wedge or a row — the hole names it.
        <CitationChip citationId={WEIGHTS_CITE} />
      </ChartCaption>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="relative mx-auto w-full max-w-sm">
          <svg viewBox="0 0 100 100" className="w-full" role="group" aria-label="Official CPI 2024 basket weights">
            {slices.map((s) => {
              const on = s.id === active;
              return (
                <a
                  key={s.id}
                  href={s.href}
                  aria-label={`${s.label}, ${s.weight.toFixed(2)} percent of the official basket, they printed ${formatPct(s.yoyPct)} over twelve months`}
                  onClick={(e) => {
                    e.preventDefault();
                    nav(s.href);
                  }}
                >
                  <path
                    d={donutSlice(s.start, s.end)}
                    fill={s.color}
                    fillOpacity={on ? 1 : 0.88}
                    stroke="var(--ink)"
                    strokeOpacity="0.35"
                    strokeWidth="0.5"
                    onMouseEnter={() => setActive(s.id)}
                    onFocus={() => setActive(s.id)}
                  />
                </a>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-[26%] flex flex-col items-center justify-center px-2 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[0.7rem] font-semibold leading-tight text-ink">
              <Swatch color={current.color} />
              {current.label}
            </p>
            <p className="num mt-1 text-xl font-medium sm:text-2xl">{current.weight.toFixed(2)}%</p>
            <p className="mt-1 text-[0.7rem] text-ink/70">of the official basket</p>
          </div>
        </div>
        <ol className="m-0 grid grid-cols-1 gap-0 p-0 sm:grid-cols-2">
          {slices.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <Link
                  to={s.href}
                  className={`flex items-center gap-2.5 px-2 py-2 no-underline ${
                    on ? "bg-ink/[0.08] text-ink" : "text-ink hover:bg-ink/[0.04]"
                  }`}
                  onMouseEnter={() => setActive(s.id)}
                  onFocus={() => setActive(s.id)}
                >
                  <Swatch color={s.color} />
                  <span className="min-w-0 flex-1 leading-snug">{s.label}</span>
                  <span className="num shrink-0 text-sm">{s.weight.toFixed(2)}%</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
