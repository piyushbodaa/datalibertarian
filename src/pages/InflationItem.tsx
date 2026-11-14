import { Link, Navigate, useParams } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { getInflationItem, printedBeside, roomOf } from "../data/inflation/items";
import {
  formatDay,
  formatFromTo,
  formatPct,
  formatPrice,
  latest,
  yearPair,
} from "../data/inflation/yoy";

export function InflationItemPage() {
  const { id } = useParams();
  const item = id ? getInflationItem(id) : undefined;
  if (!item) return <Navigate to="/inflation" replace />;
  const pair = yearPair(item);
  const now = latest(item.observed);
  const gov = printedBeside(item);
  const cites = [...new Set([...item.observed.map((p) => p.citationId), gov.citationId])];

  return (
    <article>
      <p className="kicker">{item.officialName}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {item.plainLabel}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="carbon-sheet border-l-4 border-l-[var(--rust)] px-5 py-6">
          <p className="kicker text-rust">Official MoSPI CPI</p>
          <p className="num mt-3 text-4xl font-semibold whitespace-nowrap">{formatPct(gov.yoyPct)}</p>
          <p className="mt-3 text-sm text-ink/75">
            {gov.label} (July 2025 → July 2026).
            {gov.kind === "item"
              ? ` Index movement only, distinct from single-unit retail prices of ${item.plainLabel.toLowerCase()}.`
              : ""}
            <CitationChip citationId={gov.citationId} />
          </p>
        </section>
        <section className="carbon-sheet border-l-4 border-l-[var(--zinc)] px-5 py-6">
          <p className="kicker text-zinc">Observed Retail Average</p>
          {pair ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/55">From</p>
              <p className="num text-2xl font-semibold">{formatPrice(pair.then)}</p>
              <p className="text-sm text-ink/60">{formatDay(pair.then.asOf)}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/55">To</p>
              <p className="num text-2xl font-semibold">{formatPrice(pair.now)}</p>
              <p className="text-sm text-ink/60">{formatDay(pair.now.asOf)}</p>
              <p className="mt-4 text-base font-medium text-ink">{formatFromTo(pair.then, pair.now)}</p>
              <CitationChip citationId={pair.now.citationId} />
            </>
          ) : now ? (
            <p className="mt-3 text-sm text-ink/80">
              {formatPrice(now)} on {formatDay(now.asOf)}. Prior-year retail average is not in the bulletin, so twelve-month change is omitted.
              <CitationChip citationId={now.citationId} />
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink/70">No observed retail average published.</p>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Printed prices</h2>
        <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
          {item.observed
            .slice()
            .sort((a, b) => a.asOf.localeCompare(b.asOf))
            .map((p) => (
              <li key={p.asOf} className="flex justify-between gap-3 py-3 text-sm">
                <span>{formatDay(p.asOf)}</span>
                <span className="num">
                  {formatPrice(p)}
                  <CitationChip citationId={p.citationId} compact />
                </span>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {cites.map((c) => (
            <CitationFootnote key={c} citationId={c} />
          ))}
        </ol>
        <p className="mt-6">
          <Link to={`/inflation/${roomOf(item)}`}>Back to {roomOf(item)}</Link>
          {" · "}
          <Link to="/inflation">Inflation</Link>
          {" · "}
          <Link to="/inflation/method">Price sources &amp; methodology</Link>
        </p>
      </section>
    </article>
  );
}
