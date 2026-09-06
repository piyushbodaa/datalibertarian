import type { Money as MoneyT } from "../data/maharashtra-police";
import { formatMoneyShort, seriesYearLabel } from "../lib/money";
import { CitationChip } from "./CitationChip";

type Props = {
  money: MoneyT;
  size?: "hero" | "row" | "inline";
  showSeries?: boolean;
};

export function Money({ money, size = "inline", showSeries = false }: Props) {
  const figure = formatMoneyShort(money);
  if (size === "hero") {
    return (
      <p className="m-0">
        <span className="num block text-4xl font-medium leading-none tracking-tight sm:text-5xl">
          {figure}
        </span>
        <span className="mt-3 block text-sm text-ink/70">
          {showSeries ? `${seriesYearLabel(money)} · ` : null}
          <CitationChip citationId={money.citationId} />
        </span>
      </p>
    );
  }
  return (
    <span className="whitespace-nowrap">
      <span className={`num ${size === "row" ? "text-[0.95rem]" : ""}`}>{figure}</span>
      <CitationChip citationId={money.citationId} compact={size === "row"} />
    </span>
  );
}
