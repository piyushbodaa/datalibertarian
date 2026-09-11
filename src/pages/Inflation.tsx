import { Link } from "react-router-dom";
import { BasketPie } from "../components/BasketPie";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { AS_OF, CPI_FOOD, CPI_HEADLINE, INFLATION_ITEMS } from "../data/inflation/items";
import { CPI_DIVISIONS, ROOMS, WEIGHTS_CITE } from "../data/inflation/weights";
import { formatDay, formatPct, formatPrice, yearPair } from "../data/inflation/yoy";

export function InflationPage() {
  const priced = INFLATION_ITEMS.map((item) => {
    const pair = yearPair(item);
    if (!pair) return null;
    return { item, pair };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <article>
      <p className="kicker">Inflation bulletin · India</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Observed rupees beside the printed index
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Official CPI for July 2026 (base 2024=100, provisional). Kitchen and fuel rupees as on{" "}
        {formatDay(AS_OF)}. Not a live ticker. A percent always names both prices and both dates.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="index-slip px-4 py-6">
          <p className="kicker">What they printed</p>
          <p className="num num-hero mt-3 m-0">{formatPct(CPI_HEADLINE.yoyPct)}</p>
          <p className="mt-3 text-sm text-ink/70">
            All-India CPI Combined, July 2025 → July 2026. Index {CPI_HEADLINE.index}.
            <CitationChip citationId={CPI_HEADLINE.citationId} />
          </p>
        </section>
        <section className="index-slip px-4 py-6">
          <p className="kicker">Food, as they printed it</p>
          <p className="num num-hero mt-3 m-0">{formatPct(CPI_FOOD.yoyPct)}</p>
          <p className="mt-3 text-sm text-ink/70">
            Consumer Food Price Index, same twelve months. Not a rupee.
            <CitationChip citationId={CPI_FOOD.citationId} />
          </p>
        </section>
      </div>

      <BasketPie />

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Smaller baskets</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Each room is one slice of the official basket, or the fuel rupees PPAC printed. Empty
          observed cells are unread, not ₹0.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {ROOMS.map((room) => {
            const div = room.divisionId
              ? CPI_DIVISIONS.find((d) => d.id === room.divisionId)
              : undefined;
            return (
              <li key={room.id}>
                <Link
                  to={`/inflation/${room.id}`}
                  className="docket-door block text-ink no-underline hover:text-rust"
                >
                  <p className="font-display text-lg font-semibold">{room.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{room.blurb}</p>
                  {div ? (
                    <p className="num mt-3 text-sm">
                      Weight {div.weight.toFixed(2)}% · they printed {formatPct(div.yoyPct)} in 12
                      months
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-ink/70">Observed rupees on the next page.</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Average prices</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          From the rupee printed one year back to the rupee printed on {formatDay(AS_OF)}. The
          government column is a CPI item rate only when MoSPI printed one — never a made-up rice
          rupee.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-left">
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 pr-3 font-medium">Observed, a year ago</th>
                <th className="py-2 pr-3 font-medium">Observed, now</th>
                <th className="py-2 pr-3 font-medium">Change</th>
                <th className="py-2 font-medium">They printed</th>
              </tr>
            </thead>
            <tbody>
              {priced.map(({ item, pair }) => {
                const pct = (pair.now.rupees / pair.then.rupees - 1) * 100;
                const delta = pair.now.rupees - pair.then.rupees;
                return (
                  <tr key={item.id} className="border-b border-ink/10">
                    <td className="py-3 pr-3">
                      <Link to={`/inflation/item/${item.id}`}>{item.plainLabel}</Link>
                    </td>
                    <td className="num py-3 pr-3">
                      {formatPrice(pair.then)}
                      <span className="block text-xs text-ink/55">{formatDay(pair.then.asOf)}</span>
                    </td>
                    <td className="num py-3 pr-3">
                      {formatPrice(pair.now)}
                      <span className="block text-xs text-ink/55">{formatDay(pair.now.asOf)}</span>
                    </td>
                    <td className="num py-3 pr-3">
                      {delta > 0 ? "+" : delta < 0 ? "−" : ""}₹
                      {Math.abs(delta).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {" · "}
                      {formatPct(pct)}
                      <span className="block text-xs text-ink/55">in 12 months</span>
                    </td>
                    <td className="py-3 text-ink/75">
                      {item.official ? (
                        <>
                          CPI item {formatPct(item.official.yoyPct)}
                          <span className="block text-xs text-ink/55">
                            {item.official.period} · index, not a rupee
                          </span>
                        </>
                      ) : (
                        <span className="text-ink/50">No item rupee printed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId={CPI_HEADLINE.citationId} />
          <CitationFootnote citationId={WEIGHTS_CITE} />
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
