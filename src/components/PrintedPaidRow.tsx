import { Link } from "react-router-dom";
import { CitationChip } from "./CitationChip";
import type { InflationItem } from "../data/inflation/types";
import { printedBeside } from "../data/inflation/items";
import { formatFromTo, formatPct, pctChange, yearPair } from "../data/inflation/yoy";

/** Two cited series for one kitchen or pump item. Never a third “true CPI.” */
export function PrintedPaidRow({ item }: { item: InflationItem }) {
  const pair = yearPair(item);
  const gov = printedBeside(item);
  const yoy = pair ? pctChange(pair.now, pair.then) : undefined;

  return (
    <li className="border-b border-ink/15 py-6">
      <h3 className="font-display text-xl font-semibold">
        <Link to={`/inflation/item/${item.id}`} className="text-ink no-underline hover:text-rust">
          {item.plainLabel}
        </Link>
      </h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="index-slip px-4 py-4">
          <p className="kicker">They printed</p>
          <p className="num mt-2 text-3xl font-medium whitespace-nowrap">{formatPct(gov.yoyPct)}</p>
          <p className="mt-2 text-sm text-ink/70">
            {gov.label}. July 2025 → July 2026.
            {gov.kind === "item" ? " An index, not a shop rupee." : ""}
            <CitationChip citationId={gov.citationId} compact />
          </p>
        </div>
        <div className="border border-[var(--rule)] border-l-[3px] border-l-[var(--rust)] px-4 py-4">
          <p className="kicker">You paid</p>
          {pair && yoy !== undefined ? (
            <>
              <p className="num mt-2 text-3xl font-medium whitespace-nowrap">{formatPct(yoy)}</p>
              <p className="mt-2 text-sm text-ink/80">
                {formatFromTo(pair.then, pair.now)}
                <CitationChip citationId={pair.now.citationId} compact />
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/70">Year-ago rupee not typed. Empty, not ₹0.</p>
          )}
        </div>
      </div>
    </li>
  );
}
