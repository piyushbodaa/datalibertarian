import { Link, Navigate, useParams } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { getInflationItem } from "../data/inflation/items";
import { formatPct, formatPrice, latest, momOf, yoyOf } from "../data/inflation/yoy";

export function InflationItemPage() {
  const { id } = useParams();
  const item = id ? getInflationItem(id) : undefined;
  if (!item) return <Navigate to="/inflation" replace />;
  const now = latest(item.observed);
  const yoy = yoyOf(item);
  const mom = momOf(item);
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

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="docket-slip">
          <h2 className="font-display text-lg font-semibold">Observed rupee</h2>
          {now ? (
            <>
              <p className="num num-hero mt-3 m-0">{formatPrice(now)}</p>
              <p className="mt-3 text-sm text-ink/70">
                As printed {now.asOf}
                {now.centre === "delhi" ? " · Delhi outlet" : " · all-India average"}
                <CitationChip citationId={now.citationId} />
              </p>
              <p className="mt-2 text-sm text-ink/80">
                Twelve months: {yoy !== undefined ? formatPct(yoy) : "not typed"}
                {" · "}
                One month: {mom !== undefined ? formatPct(mom) : "not typed"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink/70">No observed rupee typed.</p>
          )}
        </section>
        <section className="index-slip">
          <h2 className="font-display text-lg font-semibold">What they printed</h2>
          {item.official ? (
            <>
              <p className="num num-hero mt-3 m-0">{formatPct(item.official.yoyPct)}</p>
              <p className="mt-3 text-sm text-ink/70">
                MoSPI CPI item, {item.official.period}. An index change, not a rupee.
                <CitationChip citationId={item.official.citationId} />
              </p>
              {yoy !== undefined ? (
                <p className="mt-2 text-sm text-ink/80">
                  Observed twelve-month change is {formatPct(yoy)}. That gap is two cited series,
                  not a third “true CPI.”
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 max-w-prose text-sm text-ink/70">
              MoSPI did not print a matching item rate in the July 2026 note we typed. Empty, not
              ₹0.
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
                <span>{p.asOf}</span>
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
          <Link to={`/inflation/${item.category}`}>Back to category</Link>
          {" · "}
          <Link to="/inflation">Inflation</Link>
          {" · "}
          <Link to="/inflation/method">Method</Link>
        </p>
      </section>
    </article>
  );
}
