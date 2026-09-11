import { Link } from "react-router-dom";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";
import { CPI_DIVISIONS, WEIGHTS_CITE, type HatchTone } from "../data/inflation/weights";
import { formatPct } from "../data/inflation/yoy";

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function slicePath(start: number, end: number): string {
  const large = end - start > 180 ? 1 : 0;
  const [x1, y1] = polar(50, 50, 48, start);
  const [x2, y2] = polar(50, 50, 48, end);
  return `M 50 50 L ${x1.toFixed(3)} ${y1.toFixed(3)} A 48 48 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

const FILL: Record<HatchTone, string> = {
  rust: "var(--rust)",
  carbon: "var(--carbon)",
  ochre: "var(--ochre)",
  zinc: "var(--zinc)",
};

export function BasketPie() {
  let cursor = 0;
  const slices = CPI_DIVISIONS.map((d) => {
    const start = cursor;
    cursor += (d.weight / 100) * 360;
    return { ...d, start, end: cursor };
  });

  return (
    <figure className="mt-8">
      <ChartCaption title="The basket they use">
        Combined CPI 2024 weights from the Household Consumption Expenditure Survey 2023-24. Food is
        36.75% of the official basket — down from 42.62% in the 2012 series. This pie is not
        observed rupees.
        <CitationChip citationId={WEIGHTS_CITE} />
      </ChartCaption>
      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-sm" role="img" aria-label="Official CPI 2024 basket weights">
          {slices.map((s) => (
            <path
              key={s.id}
              d={slicePath(s.start, s.end)}
              fill={FILL[s.hatch]}
              fillOpacity={0.72}
              stroke="var(--paper)"
              strokeWidth="0.6"
            />
          ))}
        </svg>
        <ol className="m-0 grid gap-x-6 gap-y-2 p-0 text-sm sm:grid-cols-2">
          {CPI_DIVISIONS.map((d) => (
            <li key={d.id} className="flex items-baseline justify-between gap-2">
              <Link to={d.href} className="min-w-0 text-ink no-underline hover:text-rust">
                {d.label}
              </Link>
              <span className="num shrink-0 text-ink/75">
                {d.weight.toFixed(2)}%
                {" · "}
                {formatPct(d.yoyPct)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
