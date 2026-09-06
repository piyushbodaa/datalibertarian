import type { LineItem, Series } from "../data/maharashtra-police";
import { pickAmount } from "../data/maharashtra-police";
import { formatMoneyShort } from "../lib/money";
import { CitationChip } from "./CitationChip";

type Props = {
  items: LineItem[];
  fiscalYear: string;
  series: Series;
};

export function ShareStripe({ items, fiscalYear, series }: Props) {
  const rows = items
    .map((item) => {
      const amount = pickAmount(item, fiscalYear, series);
      return amount ? { item, amount } : null;
    })
    .filter((r): r is { item: LineItem; amount: NonNullable<ReturnType<typeof pickAmount>> } => r !== null)
    .sort((a, b) => b.amount.crore - a.amount.crore);

  const total = rows.reduce((s, r) => s + r.amount.crore, 0);
  if (total <= 0) return null;
  const citationId = rows[0].amount.citationId;
  const max = rows[0].amount.crore;
  const major = rows.filter((r) => r.amount.crore / total >= 0.02);
  const other = rows.filter((r) => r.amount.crore / total < 0.02);
  const otherSum = other.reduce((s, r) => s + r.amount.crore, 0);
  const display = [
    ...major.map((r) => ({
      id: r.item.id,
      label: r.item.plainLabel,
      crore: r.amount.crore,
      money: r.amount,
    })),
  ];
  if (otherSum > 0) {
    display.push({
      id: "other",
      label: `Other heads (${other.length} lines)`,
      crore: otherSum,
      money: { ...rows[0].amount, crore: otherSum, rupees: Math.round(otherSum * 10_000_000) },
    });
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Where the police rupee sits</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink/70">
        Ranked against the largest line (district police). Running costs only (head 2055, voted),{" "}
        {fiscalYear} {series === "be" ? "budget" : series === "re" ? "revised" : "actuals"}. Same
        document, same year.
        <CitationChip citationId={citationId} />
      </p>
      <ol className="mt-5 space-y-3">
        {display.map((r) => {
          const pct = (r.crore / total) * 100;
          const width = (r.crore / max) * 100;
          return (
            <li key={r.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">{r.label}</span>
                <span className="num shrink-0 text-ink/80">
                  {pct.toFixed(1)}% · {formatMoneyShort(r.money)}
                </span>
              </div>
              <div className="mt-1 h-px w-full bg-ink/15">
                <div className="h-px bg-tyrian" style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
