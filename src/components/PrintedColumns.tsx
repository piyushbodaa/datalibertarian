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

const SERIES_HATCH: Record<string, string> = {
  actual: "hatch-rust",
  be: "hatch-carbon",
  re: "hatch-ochre",
};

export function PrintedColumns({
  run,
  cap,
  caption = "Actual expenditure, Budget Estimate (BE), Revised Estimate (RE), and current Budget Estimate.",
  title = "Four-column official budget record",
  compact = false,
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

  return (
    <figure className={compact ? "mt-4" : "mt-8"}>
      <ChartCaption title={title}>
        {caption}
        {citationId && !compact ? <CitationChip citationId={citationId} /> : null}
      </ChartCaption>

      <ol className="grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {columns.map((col) => {
          const missing = !col.run || !col.cap;
          const height = missing ? 0 : Math.max((col.total / max) * 100, 2);
          return (
            <li key={`${col.fiscalYear}-${col.series}`} className="carbon-sheet p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">{SERIES_LABEL[col.series]}</p>
              <p className="text-xs text-ink/50">{col.fiscalYear}</p>
              <div
                className="mt-3 flex h-28 items-end overflow-hidden rounded-md bg-slate-100 sm:h-36"
                role="img"
                aria-label={
                  missing
                    ? `${SERIES_LABEL[col.series]} ${col.fiscalYear}: not printed`
                    : `${SERIES_LABEL[col.series]} ${col.fiscalYear}, ₹${formatCrore(col.total)} crore`
                }
              >
                {missing ? null : (
                  <div className={`w-full rounded-t-sm ${SERIES_HATCH[col.series]}`} style={{ height: `${height}%` }} />
                )}
              </div>
              <p className="num mt-2.5 text-sm font-medium">
                {missing ? "—" : `₹${formatCrore(col.total)} crore`}
              </p>
            </li>
          );
        })}
      </ol>
      {compact ? null : (
        <p className="mt-3 max-w-3xl text-[0.75rem] text-ink/60">
          Amounts in ₹ crore. Actuals, Budget Estimates, and Revised Estimates are distinct accounting stages — not a uniform time series.
        </p>
      )}
    </figure>
  );
}
