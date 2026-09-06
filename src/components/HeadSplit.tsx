import type { Money } from "../data/maharashtra-police";
import { formatCrore } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Props = {
  run: Money;
  cap: Money;
};

export function HeadSplit({ run, cap }: Props) {
  const total = run.crore + cap.crore;
  const runPct = (run.crore / total) * 100;
  const capPct = (cap.crore / total) * 100;

  return (
    <figure className="mt-8">
      <ChartCaption title="Running costs and capital, this plan">
        Same Budget column as the headline. Capital is a thin slice — that is the book, not a
        drawing error.
        <CitationChip citationId={run.citationId} />
      </ChartCaption>
      <div
        className="flex h-10 w-full max-w-3xl overflow-hidden border border-carbon/40"
        role="img"
        aria-label={`Running costs ${runPct.toFixed(1)} percent. Capital ${capPct.toFixed(1)} percent.`}
      >
        <div className="hatch-carbon h-full" style={{ width: `${runPct}%` }} />
        <div
          className="hatch-ochre h-full border-l-2 border-ochre"
          style={{ width: `${capPct}%` }}
        />
      </div>
      <dl className="mt-3 flex max-w-3xl flex-wrap gap-x-8 gap-y-1 text-sm">
        <div>
          <dt className="inline text-ink/70">Running costs · 2055 · {runPct.toFixed(1)}%</dt>
          <dd className="ml-2 inline num">₹{formatCrore(run.crore)} crore</dd>
        </div>
        <div>
          <dt className="inline text-ochre">Capital · 4055 · {capPct.toFixed(1)}%</dt>
          <dd className="ml-2 inline num">₹{formatCrore(cap.crore)} crore</dd>
        </div>
      </dl>
    </figure>
  );
}
