import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { PriceHatch } from "../components/PriceHatch";
import {
  AS_OF,
  BOARD_IDS,
  CATEGORIES,
  CPI_FOOD,
  CPI_HEADLINE,
  getInflationItem,
  INFLATION_ITEMS,
} from "../data/inflation/items";
import { formatPct, formatPrice, latest, yoyOf } from "../data/inflation/yoy";

export function InflationPage() {
  const board = BOARD_IDS.map((id) => getInflationItem(id)).filter(
    (i): i is NonNullable<typeof i> => Boolean(i),
  );
  const hatchRows = INFLATION_ITEMS.map((item) => {
    const yoy = yoyOf(item);
    if (yoy === undefined) return null;
    const now = latest(item.observed)!;
    return {
      id: item.id,
      label: item.plainLabel,
      pct: yoy,
      citationId: now.citationId,
      href: `/inflation/item/${item.id}`,
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.pct - a.pct);

  return (
    <article>
      <p className="kicker">Observed prices · not the CPI</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        What you pay
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        All-India average retail rupees from the Price Monitoring Division, as printed on {asOfLabel(AS_OF)}.
        Not MoSPI’s consumer price index. Not a live ticker. Empty means we have not typed a second
        date — not that the change is zero.
      </p>

      <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20">
        {board.map((item) => {
          const now = latest(item.observed);
          const yoy = yoyOf(item);
          if (!now) return null;
          return (
            <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <Link to={`/inflation/item/${item.id}`} className="font-medium text-ink no-underline hover:text-rust">
                {item.plainLabel}
              </Link>
              <span className="num text-sm text-ink/80">
                {formatPrice(now)}
                {yoy !== undefined ? ` · ${formatPct(yoy)} year` : " · year not typed"}
                <CitationChip citationId={now.citationId} compact />
              </span>
            </li>
          );
        })}
      </ul>

      <PriceHatch
        title="Twelve-month change, observed rupees"
        note="Only items with two cited dates. Ranked high to low. Hatch is not MoSPI CPI."
        rows={hatchRows}
      />

      <section className="index-slip mt-10">
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">What they printed</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          MoSPI’s All India CPI Combined for July 2026 (base 2024=100, provisional) is{" "}
          {formatPct(CPI_HEADLINE.yoyPct)} over twelve months. Food (CFPI) is {formatPct(CPI_FOOD.yoyPct)}.
          That is an index, not the rupee on the board above. They changed the basket (2012 → 2024).
          <CitationChip citationId={CPI_HEADLINE.citationId} />
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Categories</h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/inflation/${c.id}`}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Housing, health, education</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          No independent monthly rupee series is typed here. We do not fill those rooms with the CPI.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId={CPI_HEADLINE.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/inflation/method">How this bulletin is built</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </section>
    </article>
  );
}

function asOfLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}
