import { Link } from "react-router-dom";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";
import { CPI_HEADLINE } from "../data/inflation/items";
import { CPI_DIVISIONS } from "../data/inflation/weights";
import { formatPct } from "../data/inflation/yoy";

export function DivisionBars() {
  const ranked = [...CPI_DIVISIONS].sort((a, b) => b.yoyPct - a.yoyPct);
  const max = Math.max(...ranked.map((d) => Math.abs(d.yoyPct)), CPI_HEADLINE.yoyPct);
  const marker = (CPI_HEADLINE.yoyPct / max) * 100;

  return (
    <figure className="mt-10">
      <ChartCaption title="Twelve-month change by division">
        Combined CPI, July 2025 → July 2026. The vertical mark is the all-items rate{" "}
        {formatPct(CPI_HEADLINE.yoyPct)}. Click a bar for that room.
        <CitationChip citationId={CPI_HEADLINE.citationId} />
      </ChartCaption>
      <ol className="mt-4 space-y-2.5">
        {ranked.map((d) => {
          const width = (Math.abs(d.yoyPct) / max) * 100;
          return (
            <li key={d.id}>
              <Link to={d.href} className="block text-ink no-underline hover:text-rust">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden />
                    {d.label}
                  </span>
                  <span className="num shrink-0">{formatPct(d.yoyPct)}</span>
                </div>
                <div
                  className="relative mt-1 h-3 w-full bg-ink/[0.05]"
                  role="img"
                  aria-label={`${d.label}, ${formatPct(d.yoyPct)} over twelve months`}
                >
                  <div className="h-3" style={{ width: `${width}%`, background: d.color, opacity: 0.85 }} />
                  <span
                    className="absolute top-0 h-3 w-px bg-ink/50"
                    style={{ left: `${marker}%` }}
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
