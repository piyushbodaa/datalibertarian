import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

export type HatchRow = {
  id: string;
  label: string;
  pct: number;
  citationId: string;
  href?: string;
};

export function PriceHatch({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: HatchRow[];
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => Math.abs(r.pct)), 1);
  return (
    <figure className="mt-10">
      <ChartCaption title={title}>{note}</ChartCaption>
      <ol className="mt-2 space-y-3.5">
        {rows.map((r) => {
          const width = (Math.abs(r.pct) / max) * 100;
          const hatch = r.pct < 0 ? "hatch-zinc" : "hatch-carbon";
          const inner = (
            <>
              <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-3 text-sm">
                <span className="min-w-0">{r.label}</span>
                <span className="num mt-0.5 block text-[0.75rem] text-ink/80 sm:mt-0 sm:text-sm">
                  {r.pct > 0 ? "+" : r.pct < 0 ? "−" : ""}
                  {Math.abs(Math.round(r.pct * 10) / 10).toLocaleString("en-IN", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  %
                  <CitationChip citationId={r.citationId} compact />
                </span>
              </div>
              <div
                className="mt-1.5 h-3 w-full bg-ink/[0.05]"
                role="img"
                aria-label={`${r.label}, ${r.pct.toFixed(1)} percent over twelve months`}
              >
                <div className={`${hatch} h-3`} style={{ width: `${width}%` }} />
              </div>
            </>
          );
          return (
            <li key={r.id}>
              {r.href ? (
                <a href={r.href} className="block text-ink no-underline hover:text-rust">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
