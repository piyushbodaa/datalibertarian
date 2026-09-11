import { Link, Navigate, useParams } from "react-router-dom";
import { CitationChip } from "../components/CitationChip";
import { CATEGORIES, itemsIn } from "../data/inflation/items";
import { formatPct, formatPrice, latest, yoyOf } from "../data/inflation/yoy";

export function InflationCategoryPage() {
  const { category } = useParams();
  const meta = CATEGORIES.find((c) => c.id === category);
  if (!meta) return <Navigate to="/inflation" replace />;
  const rows = itemsIn(meta.id);

  return (
    <article>
      <p className="kicker">Observed prices</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{meta.label}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Printed rupees beside the CPI item rate when MoSPI printed one. Empty government cells mean
        no item rate was typed — not ₹0.
      </p>
      <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20">
        {rows.map((item) => {
          const now = latest(item.observed);
          const yoy = yoyOf(item);
          return (
            <li key={item.id} className="py-4">
              <Link to={`/inflation/item/${item.id}`} className="font-medium text-ink no-underline hover:text-rust">
                {item.plainLabel}
              </Link>
              <p className="mt-2 text-sm text-ink/80">
                Observed
                {now ? (
                  <>
                    : <span className="num">{formatPrice(now)}</span>
                    {yoy !== undefined ? ` · ${formatPct(yoy)} year` : " · year not typed"}
                    <CitationChip citationId={now.citationId} compact />
                  </>
                ) : (
                  ": not typed"
                )}
              </p>
              <p className="mt-1 text-sm text-ink/70">
                What they printed
                {item.official ? (
                  <>
                    : CPI item {formatPct(item.official.yoyPct)} ({item.official.period})
                    <CitationChip citationId={item.official.citationId} compact />
                  </>
                ) : (
                  ": no item rate typed"
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-sm">
        <Link to="/inflation">Inflation</Link>
        {" · "}
        <Link to="/inflation/method">Method</Link>
      </p>
    </article>
  );
}
