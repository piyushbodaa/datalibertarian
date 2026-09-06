import type { Money } from "../data/maharashtra-police";
import { formatCrore } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Props = {
  police: Money;
  state: Money;
  compact?: boolean;
};

export function ShareSplit({ police, state, compact = false }: Props) {
  const share = (police.crore / state.crore) * 100;
  const rest = 100 - share;

  return (
    <figure className={compact ? "mt-4" : "mt-8"}>
      <ChartCaption title={compact ? "Police share of this state book" : "Police vs the rest of this state book"}>
        {compact
          ? `Police is ${share.toFixed(1)}% of this one state book.`
          : "Police running costs and buildings against the state’s whole budget for the same year."}
        <CitationChip citationId={police.citationId} compact />
      </ChartCaption>
      <div
        className="flex h-10 w-full max-w-3xl overflow-hidden border border-carbon/40"
        role="img"
        aria-label={`Police ${share.toFixed(1)} percent of state budgeted spending. Rest of the books ${rest.toFixed(1)} percent.`}
      >
        <div
          className="hatch-carbon h-full shrink-0 border-r border-carbon/50"
          style={{ width: `${share}%` }}
        />
        <div className="hatch-zinc flex h-full min-w-0 flex-1 items-center px-3 text-xs sm:text-sm">
          Police {share.toFixed(1)}% · Everything else {rest.toFixed(1)}%
        </div>
      </div>
      <dl className="mt-3 flex max-w-3xl flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="inline text-ink/70">Police · {share.toFixed(1)}%</dt>
          <dd className="ml-2 inline num">₹{formatCrore(police.crore)} crore</dd>
        </div>
        <div>
          <dt className="inline text-ink/70">Everything else · {rest.toFixed(1)}%</dt>
          <dd className="ml-2 inline num">₹{formatCrore(state.crore - police.crore)} crore</dd>
        </div>
      </dl>
    </figure>
  );
}
