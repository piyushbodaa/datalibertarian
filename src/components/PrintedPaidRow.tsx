import { Link } from "react-router-dom";
import { CitationChip } from "./CitationChip";
import type { InflationItem } from "../data/inflation/types";
import { printedBeside } from "../data/inflation/items";
import { formatFromTo, formatPct, pctChange, yearPair } from "../data/inflation/yoy";

/** Two cited price series per staple item: official CPI rate alongside observed retail average. */
export function PrintedPaidRow({ item }: { item: InflationItem }) {
  const pair = yearPair(item);
  const gov = printedBeside(item);
  const yoy = pair ? pctChange(pair.now, pair.then) : undefined;

  return (
    <li className="carbon-sheet mb-4 list-none p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          <Link to={`/inflation/item/${item.id}`} className="text-ink no-underline hover:text-rust">
            {item.plainLabel}
          </Link>
        </h3>
        <Link
          to={`/inflation/item/${item.id}`}
          className="text-xs font-medium text-rust no-underline hover:underline"
        >
          Full price series →
        </Link>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--rule)] border-l-4 border-l-[var(--rust)] bg-slate-50/70 px-4 py-3.5">
          <p className="kicker text-rust">Official MoSPI CPI</p>
          <p className="num mt-1.5 text-3xl font-semibold whitespace-nowrap">{formatPct(gov.yoyPct)}</p>
          <p className="mt-1.5 text-sm text-ink/75">
            {gov.label} (July 2025 → July 2026).
            {gov.kind === "item" ? " Official item index, not a single retail price." : ""}
            <CitationChip citationId={gov.citationId} compact />
          </p>
        </div>
        <div className="rounded-lg border border-[var(--rule)] border-l-4 border-l-[var(--zinc)] bg-white px-4 py-3.5">
          <p className="kicker text-zinc">Observed Retail Average</p>
          {pair && yoy !== undefined ? (
            <>
              <p className="num mt-1.5 text-3xl font-semibold whitespace-nowrap">{formatPct(yoy)}</p>
              <p className="mt-1.5 text-sm text-ink/80">
                {formatFromTo(pair.then, pair.now)}. National retail average, not a single household bill.
                <CitationChip citationId={pair.now.citationId} compact />
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/65">
              Prior-year retail average not published in bulletin (left blank, not ₹0).
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
