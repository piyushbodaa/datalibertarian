import { Link, Navigate, useParams } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { PrintedPaidRow } from "../components/PrintedPaidRow";
import { itemsInRoom } from "../data/inflation/items";
import { CPI_DIVISIONS, getRoom, WEIGHTS_CITE } from "../data/inflation/weights";
import { formatPct } from "../data/inflation/yoy";

export function InflationCategoryPage() {
  const { category } = useParams();
  const room = category ? getRoom(category) : undefined;
  if (!room) return <Navigate to="/inflation" replace />;

  const div = room.divisionId ? CPI_DIVISIONS.find((d) => d.id === room.divisionId) : undefined;
  const extra =
    room.id === "other"
      ? CPI_DIVISIONS.filter((d) =>
          ["personal", "furnishings", "communication", "restaurants", "paan", "recreation"].includes(
            d.id,
          ),
        )
      : [];
  const items = itemsInRoom(room.id);

  return (
    <article>
      <p className="kicker">Basket room</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {room.label}
      </h1>
      <p className="mt-3 max-w-2xl text-ink">{room.blurb}</p>

      {div ? (
        <section className="index-slip mt-8 px-4 py-6">
          <p className="text-sm text-ink/60">What they printed · July 2026 Combined</p>
          <p className="num mt-2 text-4xl font-medium whitespace-nowrap">{formatPct(div.yoyPct)}</p>
          <p className="mt-3 text-sm text-ink/70">
            Weight in the 2024 basket: {div.weight.toFixed(2)}%. Index {div.index}.
            <CitationChip citationId={div.citationId} />
          </p>
        </section>
      ) : null}

      {extra.length > 0 ? (
        <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20">
          {extra.map((d) => (
            <li key={d.id} className="flex justify-between gap-3 py-3 text-sm">
              <span>{d.label}</span>
              <span className="num">
                {d.weight.toFixed(2)}% · {formatPct(d.yoyPct)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">They printed · You paid</h2>
          <ul className="mt-4 list-none p-0">
            {items.map((item) => (
              <PrintedPaidRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : (
        <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">No observed rupee in this room</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">
            We do not fill health, housing, education or clothing with the CPI. Empty is not ₹0.
          </p>
        </section>
      )}

      <section className="mt-12 text-sm text-ink/70">
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {div ? <CitationFootnote citationId={div.citationId} /> : null}
          {items.some((i) => i.category === "fuel") ? (
            <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          ) : items.length > 0 ? (
            <CitationFootnote citationId="pmd-retail-2026-09-10" />
          ) : (
            <CitationFootnote citationId={WEIGHTS_CITE} />
          )}
        </ol>
        <p className="mt-6">
          <Link to="/inflation">Inflation</Link>
          {" · "}
          <Link to="/inflation/method">Method</Link>
        </p>
      </section>
    </article>
  );
}
