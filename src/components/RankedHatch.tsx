import type { LineItem, Series } from "../data/maharashtra-police";
import { pickAmount } from "../data/maharashtra-police";
import { formatMoneyShort } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Props = {
  items: LineItem[];
  fiscalYear: string;
  series: Series;
  title?: string;
  note?: string;
  /** If set, percentages are of this cited total, not of the listed rows alone. */
  shareOf?: { crore: number };
  compact?: boolean;
  limit?: number;
  /** INDEX hatch uses zinc, not rust/carbon White Book language. */
  tone?: "gold" | "index";
  /** Skip the 2% “other” bucket so every cited row can show (INDEX 27). */
  showAll?: boolean;
};

export function RankedHatch({
  items,
  fiscalYear,
  series,
  title = "Where the police rupee sits",
  note,
  shareOf,
  compact = false,
  limit,
  tone = "gold",
  showAll = false,
}: Props) {
  const rows = items
    .map((item) => {
      const amount = pickAmount(item, fiscalYear, series);
      return amount ? { item, amount } : null;
    })
    .filter((r): r is { item: LineItem; amount: NonNullable<ReturnType<typeof pickAmount>> } => r !== null)
    .sort((a, b) => b.amount.crore - a.amount.crore);

  const listed = rows.reduce((s, r) => s + r.amount.crore, 0);
  const total = shareOf?.crore ?? listed;
  if (total <= 0) return null;
  const citationId = rows[0].amount.citationId;
  const max = rows[0].amount.crore;
  const major = showAll ? rows : rows.filter((r) => r.amount.crore / total >= 0.02);
  const other = showAll ? [] : rows.filter((r) => r.amount.crore / total < 0.02);
  const otherSum = other.reduce((s, r) => s + r.amount.crore, 0);
  const display = [
    ...major.map((r) => ({
      id: r.item.id,
      label: r.item.plainLabel,
      crore: r.amount.crore,
      citationId: r.amount.citationId,
    })),
  ];
  if (otherSum > 0 && !limit) {
    display.push({
      id: "other",
      label: `Other heads (${other.length} lines)`,
      crore: otherSum,
      citationId,
    });
  }
  const shown = limit ? display.slice(0, limit) : display;
  const hatchClass = tone === "index" ? "hatch-zinc border-zinc/50" : "hatch-carbon border-carbon/50";

  const seriesWord = series === "be" ? "plan" : series === "re" ? "updated plan" : "spent";

  return (
    <figure className={compact ? "mt-4" : "mt-10"}>
      <ChartCaption title={title}>
        {note ??
          `Ranked against the largest line (district police). Running costs only, ${fiscalYear} ${seriesWord}. Same document, same year. Lines under 2% are grouped as other.`}
        <CitationChip citationId={citationId} />
      </ChartCaption>
      <ol className={compact ? "mt-2 space-y-2" : "mt-2 space-y-3.5"}>
        {shown.map((r) => {
          const pct = (r.crore / total) * 100;
          const width = (r.crore / max) * 100;
          return (
            <li key={r.id}>
              <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-3 text-sm">
                <span className="min-w-0">{r.label}</span>
                <span className="num mt-0.5 block text-[0.75rem] text-ink/80 sm:mt-0 sm:text-sm">
                  {pct.toFixed(1)}% · {Number.isInteger(r.crore)
                    ? `₹${r.crore.toLocaleString("en-IN")} crore`
                    : formatMoneyShort({ ...rows[0].amount, crore: r.crore, rupees: Math.round(r.crore * 10_000_000) })}
                  <CitationChip citationId={r.citationId} compact />
                </span>
              </div>
              <div
                className="mt-1.5 h-5 w-full bg-ink/[0.05]"
                role="img"
                aria-label={`${r.label}, ${pct.toFixed(1)} percent, ₹${r.crore.toFixed(2)} crore`}
              >
                <div
                  className={`${hatchClass} h-5 border`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
