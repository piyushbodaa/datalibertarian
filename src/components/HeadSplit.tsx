import type { Money } from "../data/maharashtra-police";
import { formatCrore } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Props = {
  run: Money;
  cap: Money;
  title?: string;
  note?: string;
  runLabel?: string;
  capLabel?: string;
};

export function HeadSplit({
  run,
  cap,
  title = "Running the force vs buildings and gear",
  note = "Same year’s plan. Buildings and gear are the thin slice — that is the book.",
  runLabel = "Running costs",
  capLabel = "Buildings and gear",
}: Props) {
  const total = run.crore + cap.crore;
  const runPct = (run.crore / total) * 100;
  const capPct = (cap.crore / total) * 100;

  return (
    <figure className="mt-8">
      <ChartCaption title={title}>
        {note}
        <CitationChip citationId={run.citationId} />
      </ChartCaption>
      <div
        className="flex h-8 w-full max-w-3xl overflow-hidden bg-ink/[0.05]"
        role="img"
        aria-label={`${runLabel} ${runPct.toFixed(1)} percent. ${capLabel} ${capPct.toFixed(1)} percent.`}
      >
        <div className="hatch-carbon h-full" style={{ width: `${runPct}%` }} />
        <div className="hatch-ochre h-full" style={{ width: `${capPct}%` }} />
      </div>
      <dl className="mt-3 flex max-w-3xl flex-wrap gap-x-8 gap-y-1 text-sm">
        <div>
          <dt className="inline text-ink/70">
            {runLabel} · {runPct.toFixed(1)}%
          </dt>
          <dd className="ml-2 inline num">₹{formatCrore(run.crore)} crore</dd>
        </div>
        <div>
          <dt className="inline text-ochre">
            {capLabel} · {capPct.toFixed(1)}%
          </dt>
          <dd className="ml-2 inline num">₹{formatCrore(cap.crore)} crore</dd>
        </div>
      </dl>
    </figure>
  );
}
