import { Link, Navigate, useParams } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { getInflationItem, roomOf } from "../data/inflation/items";
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
  const cites = [
    ...new Set(
      [...item.observed.map((p) => p.citationId), item.official?.citationId].filter(
        (c): c is string => Boolean(c),
      ),
    ),
  ];

  return (
    <article>
      <p className="kicker">{item.officialName}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {item.plainLabel}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="docket-slip px-4 py-6">
          <h2 className="font-display text-lg font-semibold">Observed rupee</h2>
          {pair ? (
            <>
              <p className="mt-4 text-sm text-ink/70">From</p>
              <p className="num text-2xl">{formatPrice(pair.then)}</p>
              <p className="text-sm text-ink/60">{formatDay(pair.then.asOf)}</p>
              <p className="mt-4 text-sm text-ink/70">To</p>
              <p className="num text-2xl">{formatPrice(pair.now)}</p>
              <p className="text-sm text-ink/60">{formatDay(pair.now.asOf)}</p>
              <p className="mt-4 text-base text-ink">{formatFromTo(pair.then, pair.now)}</p>
              <CitationChip citationId={pair.now.citationId} />
            </>
          ) : now ? (
            <p className="mt-3 text-sm text-ink/80">
              {formatPrice(now)} on {formatDay(now.asOf)}. A year-ago rupee is not typed, so there is
              no twelve-month change.
              <CitationChip citationId={now.citationId} />
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink/70">No observed rupee typed.</p>
          )}
        </section>
        <section className="index-slip px-4 py-6">
          <h2 className="font-display text-lg font-semibold">What they printed</h2>
          {item.official ? (
            <>
              <p className="num num-hero mt-3 m-0">{formatPct(item.official.yoyPct)}</p>
              <p className="mt-3 text-sm text-ink/70">
                MoSPI CPI item, {item.official.period} over the previous {item.official.period.slice(0, 4) === "2026" ? "July 2025" : "year"}.
                An index change, not a rupee for this packet of {item.plainLabel.toLowerCase()}.
                <CitationChip citationId={item.official.citationId} />
              </p>
              {pair ? (
                <p className="mt-3 text-sm text-ink/80">
                  Observed path: {formatFromTo(pair.then, pair.now)}. Two cited series, not a third
                  “true CPI.”
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 max-w-prose text-sm text-ink/70">
              MoSPI did not print a rupee or a matching item rate for {item.plainLabel.toLowerCase()} in
              the July 2026 note we typed. Empty, not ₹0.
            </p>
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
          <Link to="/inflation/method">Method</Link>
        </p>
      </section>
    </article>
  );
}
